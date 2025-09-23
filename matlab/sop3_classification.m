function sop3_classification(projectRoot, models)
%SOP3_CLASSIFICATION Train/evaluate ML classifiers on patient data
% Usage:
%   sop3_classification;                     % defaults (SVM, Tree)
%   sop3_classification(root, {"svm","tree","knn"});

if nargin < 1 || isempty(projectRoot)
    here = fileparts(mfilename('fullpath'));
    projectRoot = fileparts(here);
end
if nargin < 2 || isempty(models)
    models = {"tree","nb_custom"};
end

addpath(genpath(fullfile(projectRoot, 'matlab', 'utils')));
outDir = fullfile(projectRoot, 'matlab', 'results', 'project_evaluation', 'sop3');
if ~exist(outDir, 'dir')
    mkdir(outDir);
end

% 1) Load data
T = readOrGenerateDataset(projectRoot);

% 2) Preprocess (with label)
[X, featureNames, y, ~, meta] = preprocessData(T, "TopSymptoms", 30, "TopConditions", 20, "Standardize", true);

% Ensure we have labels; if not, synthesize a label from rules
if isempty(y)
    warning('No label column detected. Generating synthetic risk labels.');
    y = synthesizeLabelsFromTable(T);
end

% Stratified train/test split (70/30)
cvp = cvpartition(y, 'HoldOut', 0.3);
Xtrain = X(training(cvp), :);
Ytrain = y(training(cvp), :);
Xtest  = X(test(cvp), :);
Ytest  = y(test(cvp), :);

results = struct();

% 3) Train models
for m = 1:numel(models)
    name = lower(string(models{m}));
    switch name
        case "svm"
            template = templateLinear('Learner','svm','Lambda',1e-4,'Regularization','ridge');
            Mdl = fitcecoc(Xtrain, Ytrain, 'Learners', template, 'Coding', 'onevsall', 'ClassNames', categories(Ytrain));
        case "tree"
            Mdl = fitctree(Xtrain, Ytrain, 'PredictorNames', [featureNames{:}], 'MinLeafSize', 5);
        case "knn"
            Mdl = fitcknn(Xtrain, Ytrain, 'NumNeighbors', 7, 'Standardize', false);
        case "nb_custom"
            % Convert to binary features for Bernoulli NB (threshold at 0 after standardization)
            XbTrain = Xtrain > 0;
            XbTest  = Xtest  > 0;
            Mdl = struct();
            Mdl.inner = naiveBayesBernoulliTrain(XbTrain, Ytrain, 1);
            Mdl.predictFcn = @(A) naiveBayesBernoulliPredict(Mdl.inner, A > 0);
        otherwise
            warning('Unknown model %s. Skipping.', name);
            continue
    end

    % 4) Evaluate
    if isfield(Mdl, 'predictFcn')
        Ypred = Mdl.predictFcn(Xtest);
    else
        Ypred = predict(Mdl, Xtest);
    end
    metrics = computeClassificationMetrics(Ytest, Ypred);

    % Confusion matrix plot
    fig1 = figure('Visible','off');
    cm = confusionchart(Ytest, Ypred);
    cm.Title = sprintf('Confusion Matrix - %s', upper(name));
    saveFigure(fig1, outDir, sprintf('sop3_confusion_%s', name));

    % ROC-like scores via ECOC loss or per-class scores if available
    try
        [~, score] = predict(Mdl, Xtest);
        fig2 = figure('Visible','off');
        hold on; grid on; title(sprintf('Score Distributions - %s', upper(name)));
        for c = 1:size(score,2)
            histogram(score(:,c), 'Normalization','pdf', 'DisplayStyle','stairs');
        end
        legend(compose('Class %s', string(categories(Ytrain))));
        saveFigure(fig2, outDir, sprintf('sop3_scores_%s', name));
    catch
        % skip if model doesn't produce scores
    end

    % Feature importance (Tree)
    try
        if isa(Mdl, 'ClassificationTree')
            imp = predictorImportance(Mdl);
            [vals, order] = maxk(imp, min(15, numel([featureNames{:}])));
            fig3 = figure('Visible','off');
            barh(vals); yticklabels(string([featureNames{:}])(order));
            title(sprintf('Feature Importance - %s', upper(name)));
            saveFigure(fig3, outDir, sprintf('sop3_feature_importance_%s', name));
        end
    catch
    end

    % Save
    R = struct();
    R.name = char(name);
    R.metrics = metrics;
    R.model = Mdl; %#ok<STRNU>
    results.(char(name)) = R;

    % Console report
    fprintf('%s -> Acc: %.3f, Prec: %.3f, Rec: %.3f, F1: %.3f\n', upper(name), metrics.accuracy, metrics.precision, metrics.recall, metrics.f1);
end

% Save overall
save(fullfile(outDir, 'sop3_classification_results.mat'), 'results', 'meta');

% Write per-model metrics CSV
names = fieldnames(results);
acc = zeros(numel(names),1); prec = acc; rec = acc; f1 = acc;
for i = 1:numel(names)
    m = results.(names{i}).metrics;
    acc(i) = m.accuracy; prec(i) = m.precision; rec(i) = m.recall; f1(i) = m.f1;
end
tbl = table(string(names), acc, prec, rec, f1, 'VariableNames', {'Model','Accuracy','Precision','Recall','F1'});
writetable(tbl, fullfile(outDir, 'sop3_metrics_summary.csv'));

end

function y = synthesizeLabelsFromTable(T)
% Try to derive risk label based on Symptoms and PastConditions
symCol = []; pastCol = [];
for v = 1:numel(T.Properties.VariableNames)
    n = lower(T.Properties.VariableNames{v});
    if any(strcmp(n, {'symptoms','current_symptoms','symptom_list'}))
        symCol = v; end
    if any(strcmp(n, {'pastconditions','past_conditions','medical_history'}))
        pastCol = v; end
end
N = height(T);
lbl = strings(N,1);
for i = 1:N
    s = ""; p = "";
    if ~isempty(symCol), s = string(T{i,symCol}); end
    if ~isempty(pastCol), p = string(T{i,pastCol}); end
    s_tokens = lower(strtrim(split(s, {',',';','|','/'})));
    p_tokens = lower(strtrim(split(p, {',',';','|','/'})));
    severe = any(ismember(s_tokens, ["shortness_breath","fever"])) && any(ismember(p_tokens, ["heart_disease","kidney_disease"]));
    medium = any(ismember(s_tokens, ["fever","chills","rash"])) || any(ismember(p_tokens, ["hypertension","diabetes","asthma"]));
    if severe
        lbl(i) = "High";
    elseif medium
        lbl(i) = "Medium";
    else
        lbl(i) = "Low";
    end
end
y = categorical(lbl);
end


