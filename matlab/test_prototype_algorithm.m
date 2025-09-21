function test_prototype_algorithm()
% test_prototype_algorithm
% 
% Standalone MATLAB script to test the prototype's health risk assessment
% algorithm as implemented in src/services/ProductionRiskAssessment.ts and
% src/services/ModelDeploymentService.ts (risk score composition and
% thresholds). It loads available CSV datasets in the project root,
% computes risk components and overall risk, prints summaries, and writes
% result CSVs next to the input files.
%
% Accuracy evaluation:
% - If a ground-truth label column exists (one of: riskLevel, risk_level,
%   trueRisk, label, groundTruth, ground_truth), the script computes
%   accuracy, confusion matrix, precision/recall/F1 (macro).
% - If not present, it computes a severity-based proxy label
%   (severity >= 8 -> high; >=5 -> medium; else low) and reports proxy
%   accuracy against predictions.
%
% Usage:
%   - From MATLAB/Octave, set current folder to the project root (where this
%     script's parent folder resides), then run:
%       >> matlab/test_prototype_algorithm
%

    % Locate project root (assume this script lives under <root>/matlab)
    scriptFolder = fileparts(mfilename('fullpath'));
    projectRoot = fileparts(scriptFolder);

    % Model config (mirrors deployed-model-config.json if present)
    modelConfig = loadModelConfig(projectRoot);

    % Candidate dataset files to evaluate
    candidateFiles = {
        'datasets/basic_health_assessment_dataset.csv'
        'datasets/temporal_health_patterns_dataset.csv'
        'datasets/general_health_symptoms_dataset.csv'
        'datasets/rural_healthcare_access_dataset.csv'
        'datasets/mental_health_conditions_dataset.csv'
    };

    evaluatedAny = false;
    for i = 1:numel(candidateFiles)
        inPath = fullfile(projectRoot, candidateFiles{i});
        if exist(inPath, 'file') ~= 2
            continue; % skip missing files
        end

        fprintf('\n=== Evaluating %s ===\n', candidateFiles{i});
        try
            T = readtable(inPath, 'TextType','string');
        catch readErr
            warning('Failed to read %s: %s', inPath, readErr.message);
            continue;
        end

        % Validate required columns
        requiredVars = ["symptoms","severity","sleep","stress","exercise","diet"];
        if ~all(ismember(requiredVars, string(T.Properties.VariableNames)))
            missing = requiredVars(~ismember(requiredVars, string(T.Properties.VariableNames)));
            warning('Skipping %s (missing columns: %s)', candidateFiles{i}, strjoin(cellstr(missing), ', '));
            continue;
        end

        % Ensure types
        T.severity = toDoubleSafe(T.severity);
        T.sleep    = toDoubleSafe(T.sleep);
        T.stress   = toDoubleSafe(T.stress);
        T.exercise = toDoubleSafe(T.exercise);
        T.diet     = string(T.diet);
        if ismember('notes', T.Properties.VariableNames)
            T.notes = string(T.notes);
        else
            T.notes = repmat("", height(T), 1);
        end
        if ismember('timestamp', T.Properties.VariableNames)
            try
                ts = string(T.timestamp);
                % Handle ISO and other formats gracefully
                T.timestamp = datetime(ts, 'InputFormat','yyyy-MM-dd''T''HH:mm:ssXXX', 'TimeZone','UTC');
            catch
                T.timestamp = repmat(datetime('now','TimeZone','UTC'), height(T), 1);
            end
        else
            T.timestamp = repmat(datetime('now','TimeZone','UTC'), height(T), 1);
        end

        % Prepare outputs
        n = height(T);
        severityRisk  = zeros(n,1);
        lifestyleRisk = zeros(n,1);
        symptomRisk   = zeros(n,1);
        riskScore     = zeros(n,1);
        overallRisk   = strings(n,1);
        confidence    = zeros(n,1);
        followUp      = false(n,1);

        for r = 1:n
            % Parse and normalize symptoms array
            symList = parseSymptoms(T.symptoms(r));

            % Compute components (mirrors ProductionRiskAssessment.ts)
            sevR = calculateSeverityRisk(T.severity(r));
            lifeR = calculateLifestyleRisk(T.sleep(r), T.stress(r), T.exercise(r), T.diet(r));
            symR = calculateSymptomRisk(symList);

            % Overall risk score
            score = round(sevR * 0.4 + lifeR * 0.3 + symR * 0.3);

            % Determine level
            level = determineRiskLevel(score);

            % Confidence (mirrors simple deployed confidence blending with f1)
            confidence(r) = min(1, max(0, modelConfig.performance.f1Score * 0.9 + rand() * 0.1));

            % Follow-up recommendation
            followUp(r) = (level == "high") || (score >= 60);

            % Store
            severityRisk(r)  = sevR;
            lifestyleRisk(r) = lifeR;
            symptomRisk(r)   = symR;
            riskScore(r)     = score;
            overallRisk(r)   = level;
        end

        % Summaries
        fprintf('Count: %d\n', n);
        fprintf('Risk distribution (%%): low=%0.1f, medium=%0.1f, high=%0.1f\n', ...
            100*mean(overallRisk=="low"), 100*mean(overallRisk=="medium"), 100*mean(overallRisk=="high"));
        fprintf('Mean risk score: %0.2f (std %0.2f)\n', mean(riskScore), std(riskScore));

        % Write results CSV
        outT = table;
        if ismember('id', T.Properties.VariableNames), outT.id = T.id; end
        if ismember('userId', T.Properties.VariableNames), outT.userId = T.userId; end
        outT.timestamp = T.timestamp;
        outT.severity = T.severity;
        outT.sleep = T.sleep;
        outT.stress = T.stress;
        outT.exercise = T.exercise;
        outT.diet = T.diet;
        outT.symptoms = string(T.symptoms);
        outT.severityRisk = severityRisk;
        outT.lifestyleRisk = lifestyleRisk;
        outT.symptomRisk = symptomRisk;
        outT.riskScore = riskScore;
        outT.overallRisk = overallRisk;
        outT.confidence = confidence;
        outT.followUpRecommended = followUp;
        outT.modelId = repmat(string(modelConfig.modelId), n, 1);

        [~, base, ~] = fileparts(inPath);
        outPath = fullfile(projectRoot, sprintf('results_%s.csv', base));
        try
            writetable(outT, outPath);
            fprintf('Wrote results to %s\n', outPath);
        catch writeErr
            warning('Failed to write %s: %s', outPath, writeErr.message);
        end

        % Accuracy evaluation
        [gtLabels, labelSource] = detectGroundTruthLabels(T);
        if ~isempty(gtLabels)
            [metrics, conf] = computeClassificationMetrics(gtLabels, overallRisk);
            printMetrics(metrics, conf, labelSource);
            writeMetricsMarkdown(projectRoot, base, metrics, conf, labelSource, modelConfig);
        else
            proxyLabels = computeSeverityProxyLabels(T.severity);
            [metrics, conf] = computeClassificationMetrics(proxyLabels, overallRisk);
            metrics.UsingProxyLabels = true;
            printMetrics(metrics, conf, 'severity_proxy');
            writeMetricsMarkdown(projectRoot, base, metrics, conf, 'severity_proxy', modelConfig);
        end

        evaluatedAny = true;
    end

    if ~evaluatedAny
        fprintf('No compatible datasets found. Ensure CSVs exist in project root with required columns.\n');
    end
end

function model = loadModelConfig(projectRoot)
    cfgPath = fullfile(projectRoot, 'deployed-model-config.json');
    model.modelId = 'production_model_undefined';
    model.version = '1.0.0';
    model.performance.f1Score = 0.925;
    model.performance.accuracy = 0.887;
    if exist(cfgPath, 'file') == 2
        try
            raw = fileread(cfgPath);
            j = jsondecode(raw);
            if isfield(j,'modelId'), model.modelId = string(j.modelId); end
            if isfield(j,'version'), model.version = string(j.version); end
            if isfield(j,'performance') && isstruct(j.performance) && isfield(j.performance,'f1Score')
                model.performance.f1Score = double(j.performance.f1Score);
            end
            if isfield(j,'performance') && isstruct(j.performance) && isfield(j.performance,'accuracy')
                model.performance.accuracy = double(j.performance.accuracy);
            end
        catch
            % keep defaults
        end
    end
end

function v = toDoubleSafe(x)
    try
        if iscell(x)
            v = cellfun(@(y) double(string(y)), x);
        else
            v = double(x);
        end
    catch
        try
            v = double(string(x));
        catch
            v = zeros(size(x));
        end
    end
end

function symList = parseSymptoms(symStr)
    % Accept JSON arrays or comma-separated strings; normalize underscores
    s = string(symStr);
    s = strtrim(s);
    if strlength(s) == 0
        symList = strings(0,1);
        return;
    end

    % Try JSON
    if startsWith(s, '[') && endsWith(s, ']')
        % Normalize doubled quotes from CSV
        normalized = replace(s, '""', '"');
        try
            arr = jsondecode(char(normalized));
            symList = string(arr(:));
        catch
            % Fallback: strip brackets and split by comma
            inner = extractBetween(s, 2, strlength(s)-1);
            symList = split(inner, ',');
        end
    else
        % Comma-separated
        symList = split(s, ',');
    end

    % Normalize tokens: lowercase, underscores->spaces, trim
    symList = lower(strtrim(replace(symList, '_', ' ')));
end

function [labels, source] = detectGroundTruthLabels(T)
    % Try to find a ground-truth label column in the dataset
    candidates = ["riskLevel","risk_level","trueRisk","label","groundTruth","ground_truth"];
    labels = strings(0,1);
    source = '';
    for k = 1:numel(candidates)
        col = candidates(k);
        if ismember(col, string(T.Properties.VariableNames))
            vals = string(T.(col));
            labs = lower(strtrim(vals));
            % Normalize to low/medium/high if possible
            uniq = unique(labs);
            if all(ismember(uniq, ["low","medium","high"]))
                labels = labs;
                source = char(col);
                return;
            end
        end
    end
end

function proxyLabels = computeSeverityProxyLabels(severity)
    % Build proxy labels from severity only (documented limitation)
    s = double(severity);
    proxyLabels = strings(size(s));
    proxyLabels(:) = "low";
    proxyLabels(s >= 5 & s < 8) = "medium";
    proxyLabels(s >= 8) = "high";
end

function [metrics, conf] = computeClassificationMetrics(trueLabels, predLabels)
    classes = ["low","medium","high"];
    yTrue = grp2idx_true(trueLabels, classes);
    yPred = grp2idx_true(predLabels, classes);
    n = numel(yTrue);

    % Confusion matrix 3x3
    conf = zeros(3,3);
    for i = 1:n
        conf(yTrue(i), yPred(i)) = conf(yTrue(i), yPred(i)) + 1;
    end

    acc = sum(diag(conf)) / max(1, sum(conf(:)));

    % Precision, recall, F1 per class
    precision = zeros(3,1);
    recall = zeros(3,1);
    f1 = zeros(3,1);
    for c = 1:3
        tp = conf(c,c);
        fp = sum(conf(:,c)) - tp;
        fn = sum(conf(c,:)) - tp;
        precision(c) = tp / max(1, tp + fp);
        recall(c)    = tp / max(1, tp + fn);
        if precision(c) + recall(c) == 0
            f1(c) = 0;
        else
            f1(c) = 2 * precision(c) * recall(c) / (precision(c) + recall(c));
        end
    end

    metrics = struct();
    metrics.Accuracy = acc;
    metrics.Classes = classes;
    metrics.Precision = precision;
    metrics.Recall = recall;
    metrics.F1 = f1;
    metrics.MacroPrecision = mean(precision);
    metrics.MacroRecall = mean(recall);
    metrics.MacroF1 = mean(f1);
    metrics.Support = sum(conf,2);
end

function idx = grp2idx_true(labels, classes)
    labs = lower(strtrim(string(labels)));
    idx = zeros(numel(labs),1);
    for i = 1:numel(labs)
        m = find(classes == labs(i), 1);
        if isempty(m)
            % Unknown -> map to nearest by heuristic (default low)
            m = 1;
        end
        idx(i) = m;
    end
end

function printMetrics(metrics, conf, source)
    fprintf('Accuracy source: %s\n', source);
    fprintf('Accuracy: %0.3f\n', metrics.Accuracy);
    fprintf('Macro Precision: %0.3f  Macro Recall: %0.3f  Macro F1: %0.3f\n', metrics.MacroPrecision, metrics.MacroRecall, metrics.MacroF1);
    fprintf('Confusion matrix (rows=true, cols=pred) [low,med,high]:\n');
    disp(conf);
end

function writeMetricsMarkdown(projectRoot, base, metrics, conf, source, modelConfig)
    outMd = fullfile(projectRoot, sprintf('metrics_%s.md', base));
    fid = fopen(outMd, 'w');
    if fid == -1, return; end
    cleaner = onCleanup(@() fclose(fid)); %#ok<NASGU>

    fprintf(fid, '# Metrics for %s\n\n', base);
    fprintf(fid, '- **modelId**: %s\n', string(modelConfig.modelId));
    fprintf(fid, '- **accuracy_source**: %s\n', string(source));
    if isfield(metrics, 'UsingProxyLabels') && metrics.UsingProxyLabels
        fprintf(fid, '- **note**: No ground-truth labels found; used severity-based proxy labels.\n');
    end
    fprintf(fid, '\n## Summary\n');
    fprintf(fid, '- **accuracy**: %0.4f\n', metrics.Accuracy);
    fprintf(fid, '- **macro_precision**: %0.4f\n', metrics.MacroPrecision);
    fprintf(fid, '- **macro_recall**: %0.4f\n', metrics.MacroRecall);
    fprintf(fid, '- **macro_f1**: %0.4f\n', metrics.MacroF1);

    fprintf(fid, '\n## Per-class\n');
    classes = metrics.Classes;
    for i = 1:numel(classes)
        fprintf(fid, '- %s: precision=%0.4f, recall=%0.4f, f1=%0.4f, support=%d\n', classes(i), metrics.Precision(i), metrics.Recall(i), metrics.F1(i), metrics.Support(i));
    end

    fprintf(fid, '\n## Confusion Matrix (rows=true, cols=pred)\n');
    fprintf(fid, '|       | low | medium | high |\n');
    fprintf(fid, '|------:|----:|-------:|-----:|\n');
    fprintf(fid, '| low   | %d | %d | %d |\n', conf(1,1), conf(1,2), conf(1,3));
    fprintf(fid, '| medium| %d | %d | %d |\n', conf(2,1), conf(2,2), conf(2,3));
    fprintf(fid, '| high  | %d | %d | %d |\n', conf(3,1), conf(3,2), conf(3,3));
end

function sevR = calculateSeverityRisk(severity)
    if isnan(severity)
        sevR = 0;
    else
        sevR = min(100, (severity / 10) * 100);
    end
end

function lifeR = calculateLifestyleRisk(sleepHrs, stressLvl, exerciseMin, dietStr)
    lifeR = 0;

    if ~isnan(sleepHrs)
        if sleepHrs < 6
            lifeR = lifeR + 30;
        elseif sleepHrs < 7
            lifeR = lifeR + 15;
        end
    end

    if ~isnan(stressLvl)
        if stressLvl >= 8
            lifeR = lifeR + 25;
        elseif stressLvl >= 6
            lifeR = lifeR + 15;
        end
    end

    if ~isnan(exerciseMin)
        if exerciseMin < 30
            lifeR = lifeR + 20;
        end
    end

    d = lower(strtrim(string(dietStr)));
    d = replace(d, '-', '_');
    if d == "poor"
        lifeR = lifeR + 15;
    elseif d == "limited_access"
        lifeR = lifeR + 10;
    end

    lifeR = min(100, lifeR);
end

function symR = calculateSymptomRisk(symList)
    % Mirror ProductionRiskAssessment.ts includes-based scoring
    highRisk = ["chest pain","shortness of breath","severe headache","high fever"];
    mediumRisk = ["fever","cough","nausea","dizziness"];

    symR = 10 * numel(symList); % base risk from symptom count

    for k = 1:numel(symList)
        s = symList(k);
        % contains-based matching
        if any(contains(s, highRisk))
            symR = symR + 30;
        elseif any(contains(s, mediumRisk))
            symR = symR + 15;
        end
    end

    symR = min(100, symR);
end

function level = determineRiskLevel(score)
    if score >= 70
        level = "high";
    elseif score >= 40
        level = "medium";
    else
        level = "low";
    end
end


