function T = readOrGenerateDataset(projectRoot)
%READORGENERATEDATASET Load dataset if present, otherwise synthesize data
% Tries to read CSV files from datasets/*.csv. If not found, generate a
% synthetic dataset suitable for SOP1 and SOP3.

if nargin < 1 || isempty(projectRoot)
    % assume this file is under <root>/matlab/utils
    here = fileparts(mfilename('fullpath'));
    projectRoot = fileparts(fileparts(here));
end

datasetsDir = fullfile(projectRoot, 'datasets');
files = {};
if exist(datasetsDir, 'dir')
    d = dir(fullfile(datasetsDir, '*.csv'));
    files = {d.name};
end

T = table();
if ~isempty(files)
    % Prefer general/symptom datasets
    preferred = ["general_health_symptoms_dataset.csv", "basic_health_assessment_dataset.csv"]; %#ok<NASGU>
    candidates = files;
    % Heuristic: pick the first file that contains 'symptom' or 'health'
    pick = [];
    for i = 1:numel(candidates)
        n = lower(candidates{i});
        if contains(n,'symptom') || contains(n,'health') || contains(n,'assessment')
            pick = candidates{i};
            break
        end
    end
    if isempty(pick)
        pick = candidates{1};
    end
    T = readtable(fullfile(datasetsDir, pick));
    return
end

% Generate synthetic dataset
rng(42);
N = 800;

ages = randi([1, 90], N, 1);
genders = categorical(randsample(["Male","Female"], N, true));
communities = categorical(randsample("Comm" + (1:6), N, true, [0.15 0.2 0.2 0.15 0.15 0.15]));
baseDate = datetime(2024,1,1);
timestamps = baseDate + days(randi([0, 240], N, 1));

symptomsVocabulary = ["fever","cough","fatigue","headache","nausea","vomiting","diarrhea","chills","sore_throat","shortness_breath","rash","body_ache"];
conditionsVocabulary = ["hypertension","diabetes","asthma","heart_disease","kidney_disease","none"];

% latent clusters to create recurring patterns
Ktrue = 4;
latent = randsample(1:Ktrue, N, true, [0.3 0.25 0.25 0.2]);

symptoms = strings(N,1);
pastConds = strings(N,1);
label = strings(N,1); % risk label High/Low/Medium

for i = 1:N
    k = latent(i);
    switch k
        case 1 % respiratory cluster
            sy = choose(symptomsVocabulary, [0.05 0.3 0.1 0.25 0.05 0.02 0.02 0.1 0.25 0.15 0.01 0.08]);
        case 2 % gastrointestinal cluster
            sy = choose(symptomsVocabulary, [0.05 0.05 0.2 0.05 0.2 0.18 0.18 0.05 0.05 0.02 0.02 0.1]);
        case 3 % viral-like cluster
            sy = choose(symptomsVocabulary, [0.25 0.2 0.2 0.1 0.05 0.02 0.02 0.2 0.1 0.05 0.05 0.2]);
        otherwise % dermatological / mixed
            sy = choose(symptomsVocabulary, [0.05 0.05 0.15 0.05 0.05 0.02 0.02 0.05 0.05 0.02 0.3 0.1]);
    end
    % ensure 2-4 symptoms
    sy = unique(randsample(sy, randi([2,4],1), true));
    symptoms(i) = strjoin(sy, ',');

    % past conditions 0-2
    pc = choose(conditionsVocabulary, [0.25 0.2 0.15 0.1 0.05 0.25]);
    pc = unique(randsample(pc, randi([1,2],1), true));
    pastConds(i) = strjoin(pc, ',');

    % synthetic risk label
    severe = any(ismember(sy, ["shortness_breath","fever"])) && any(ismember(pc, ["heart_disease","kidney_disease"]));
    medium = any(ismember(sy, ["fever","chills","rash"])) || any(ismember(pc, ["hypertension","diabetes","asthma"]));
    if severe
        label(i) = "High";
    elseif medium
        label(i) = "Medium";
    else
        label(i) = "Low";
    end
end

T = table(ages, genders, symptoms, pastConds, timestamps, communities, categorical(label), ...
    'VariableNames', {'Age','Gender','Symptoms','PastConditions','Timestamp','Community','Label'});

end

function out = choose(vocab, probs)
    if numel(probs) ~= numel(vocab)
        probs = ones(1, numel(vocab));
    end
    probs = probs / sum(probs);
    % return a sample of size 6 to allow 2-4 unique draws later
    out = randsample(vocab, 6, true, probs);
end


