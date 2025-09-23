function [featuresMatrix, featureNames, labelVector, timeVector, meta] = preprocessData(inputTable, varargin)
%PREPROCESSDATA Prepare patient dataset for ML models (normalize, encode)
%
% Inputs
%   inputTable  - MATLAB table with patient records. Expected (case-insensitive)
%                 columns when available:
%                 - Age, Gender, Symptoms, PastConditions, Timestamp, Community
%                 - Optional: Label (classification target)
%   Name-Value:
%     "TopSymptoms" (default 20)    - Max distinct symptoms to one-hot
%     "TopConditions" (default 20)  - Max distinct past conditions to one-hot
%     "Standardize" (default true)  - z-score numeric features
%
% Outputs
%   featuresMatrix - numeric matrix [N x D]
%   featureNames   - cellstr names for columns in featuresMatrix
%   labelVector    - [] or categorical/double class labels
%   timeVector     - datetime vector aligned to rows
%   meta           - struct with helper mappings and stats

% Parse name-value pairs (compatible with broader MATLAB versions)
validateTable = @(t) istable(t);
if ~validateTable(inputTable)
    error('preprocessData:InvalidInput', 'First argument must be a table.');
end

p = inputParser;
p.FunctionName = 'preprocessData';
addRequired(p, 'inputTable', validateTable);
addParameter(p, 'TopSymptoms', 20, @(x) isnumeric(x) && isscalar(x) && x > 0);
addParameter(p, 'TopConditions', 20, @(x) isnumeric(x) && isscalar(x) && x > 0);
addParameter(p, 'Standardize', true, @(x) islogical(x) || (isnumeric(x) && isscalar(x)));

% Allow both char and string Name-Value pairs
nv = varargin;
for i = 1:2:numel(nv)
    if i <= numel(nv) && (isstring(nv{i}) || ischar(nv{i}))
        nv{i} = char(nv{i});
    end
end
parse(p, inputTable, nv{:});
opts = p.Results;

% Normalize column names to lower for robust access
origVarNames = inputTable.Properties.VariableNames;
lowerVarNames = lower(origVarNames);

getVar = @(names) find(ismember(lowerVarNames, lower(string(names))), 1);

idxAge = getVar(["age","patient_age"]);
idxGender = getVar(["gender","sex"]);
idxSymptoms = getVar(["symptoms","current_symptoms","symptom_list"]);
idxPast = getVar(["pastconditions","past_conditions","medical_history"]);
idxTimestamp = getVar(["timestamp","date","time","recorded_at"]);
idxCommunity = getVar(["community","barangay","village","location"]);
idxLabel = getVar(["label","risk","risklevel","target"]);

N = height(inputTable);

% 1) Gather raw fields with reasonable defaults
age = nan(N,1);
if ~isempty(idxAge)
    age = preprocessData_toNumericVector(inputTable{:, idxAge});
end

genderRaw = repmat("", N, 1);
if ~isempty(idxGender)
    genderRaw = preprocessData_toStringArray(inputTable{:, idxGender});
end

symptomsRaw = strings(N,1);
if ~isempty(idxSymptoms)
    symptomsRaw = preprocessData_toStringArray(inputTable{:, idxSymptoms});
end

pastRaw = strings(N,1);
if ~isempty(idxPast)
    pastRaw = preprocessData_toStringArray(inputTable{:, idxPast});
end

timeVector = NaT(N,1);
if ~isempty(idxTimestamp)
    timeVector = preprocessData_toDatetime(inputTable{:, idxTimestamp});
else
    % fallback: sequential timestamps (daily)
    timeVector = datetime(2024,1,1) + days(0:N-1);
end

communityRaw = repmat("", N, 1);
if ~isempty(idxCommunity)
    communityRaw = preprocessData_toStringArray(inputTable{:, idxCommunity});
end

labelVector = [];
if ~isempty(idxLabel)
    lab = inputTable{:, idxLabel};
    if iscell(lab) || isstring(lab) || ischar(lab)
        labelVector = categorical(string(lab));
    else
        labelVector = lab;
    end
end

% 2) Build vocabulary for symptoms and past conditions
symptomTokens = preprocessData_splitAndCount(symptomsRaw);
pastTokens = preprocessData_splitAndCount(pastRaw);

[symptomVocab, ~] = selectTopK(symptomTokens, opts.TopSymptoms);
[pastVocab, ~] = selectTopK(pastTokens, opts.TopConditions);

% 3) Encode features
featureBlocks = {};
featureNames = {};

% Age
featureBlocks{end+1} = age;
featureNames{end+1} = {"Age"};

% Gender one-hot (no dummyvar dependency)
if any(genderRaw ~= "")
    gCat = categorical(genderRaw);
    gCats = categories(gCat);
    G = zeros(N, numel(gCats));
    for jj = 1:numel(gCats)
        G(:, jj) = double(gCat == gCats{jj});
    end
    featureBlocks{end+1} = G;
    featureNames{end+1} = cellstr("Gender_" + string(gCats));
end

% Community one-hot (no dummyvar dependency)
if any(communityRaw ~= "")
    cCat = categorical(communityRaw);
    cCats = categories(cCat);
    C = zeros(N, numel(cCats));
    for jj = 1:numel(cCats)
        C(:, jj) = double(cCat == cCats{jj});
    end
    featureBlocks{end+1} = C;
    featureNames{end+1} = cellstr("Community_" + string(cCats));
end

% Symptoms multi-hot
if ~isempty(symptomVocab)
    S = encodeMultiHot(symptomsRaw, symptomVocab);
    featureBlocks{end+1} = S;
    featureNames{end+1} = cellstr("Sym_" + symptomVocab);
end

% Past conditions multi-hot
if ~isempty(pastVocab)
    P = encodeMultiHot(pastRaw, pastVocab);
    featureBlocks{end+1} = P;
    featureNames{end+1} = cellstr("Cond_" + pastVocab);
end

% Concatenate
featuresMatrix = cat(2, featureBlocks{:});

% Replace NaNs in numeric with column medians, then standardize if needed
for j = 1:size(featuresMatrix,2)
    col = featuresMatrix(:,j);
    nanMask = isnan(col);
    if any(nanMask)
        med = median(col(~nanMask));
        if isnan(med)
            med = 0;
        end
        col(nanMask) = med;
        featuresMatrix(:,j) = col;
    end
end

mu = zeros(1, size(featuresMatrix,2));
sigma = ones(1, size(featuresMatrix,2));
if opts.Standardize
    mu = mean(featuresMatrix, 1, 'omitnan');
    sigma = std(featuresMatrix, 0, 1, 'omitnan');
    sigma(sigma == 0 | isnan(sigma)) = 1;
    featuresMatrix = bsxfun(@minus, featuresMatrix, mu);
    featuresMatrix = bsxfun(@rdivide, featuresMatrix, sigma);
end

% Build meta
meta = struct();
meta.symptomVocab = symptomVocab;
meta.pastVocab = pastVocab;
meta.featureMeans = mu;
meta.featureStds = sigma;
meta.featureNames = featureNames;

end

% ===== helper functions =====
function vec = preprocessData_toNumericVector(col)
    if isnumeric(col)
        vec = double(col);
    elseif iscell(col)
        try
            vec = cellfun(@str2double, col);
        catch
            vec = nan(numel(col),1);
        end
    elseif isstring(col) || ischar(col)
        vec = str2double(string(col));
    else
        vec = nan(numel(col),1);
    end
end

function arr = preprocessData_toStringArray(col)
    if iscellstr(col) || isstring(col) || ischar(col)
        arr = string(col);
    else
        % convert non-text to string
        try
            arr = string(col);
        catch
            arr = repmat("", numel(col), 1);
        end
    end
end

function dt = preprocessData_toDatetime(col)
    if isdatetime(col)
        dt = col;
    else
        try
            dt = datetime(col);
        catch
            % try numeric -> days offset
            try
                dt = datetime(2024,1,1) + days(double(col));
            catch
                dt = NaT(numel(col),1);
            end
        end
    end
end

function tokenCounts = preprocessData_splitAndCount(textArray)
    % Return containers.Map of token->count
    tokenCounts = containers.Map('KeyType','char','ValueType','double');
    for i = 1:numel(textArray)
        t = strtrim(textArray(i));
        if strlength(t) == 0
            continue
        end
        tokens = split(lower(t), {',',';','|','/'});
        tokens = strtrim(tokens);
        tokens(tokens=="") = [];
        for k = 1:numel(tokens)
            key = char(tokens(k));
            if isKey(tokenCounts, key)
                tokenCounts(key) = tokenCounts(key) + 1;
            else
                tokenCounts(key) = 1;
            end
        end
    end
end

function [topKeys, counts] = selectTopK(mapCounts, K)
    keysArr = string(keys(mapCounts));
    if isempty(keysArr)
        topKeys = strings(0,1);
        counts = [];
        return
    end
    valsArr = zeros(numel(keysArr),1);
    for i = 1:numel(keysArr)
        valsArr(i) = mapCounts(char(keysArr(i)));
    end
    [valsSorted, idx] = sort(valsArr, 'descend'); %#ok<ASGLU>
    topIdx = idx(1:min(K, numel(idx)));
    topKeys = keysArr(topIdx);
    counts = valsArr(topIdx);
end

function M = encodeMultiHot(textArray, vocab)
    N = numel(textArray);
    D = numel(vocab);
    M = zeros(N, D);
    vocabLower = lower(vocab(:));
    for i = 1:N
        t = lower(strtrim(textArray(i)));
        if strlength(t) == 0
            continue
        end
        tokens = split(t, {',',';','|','/'});
        tokens = strtrim(tokens);
        for k = 1:numel(tokens)
            pos = find(vocabLower == tokens(k), 1);
            if ~isempty(pos)
                M(i, pos) = 1;
            end
        end
    end
end


