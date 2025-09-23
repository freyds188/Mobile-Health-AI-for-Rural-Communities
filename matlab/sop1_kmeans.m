function sop1_kmeans(projectRoot, K, distance, varargin)
%SOP1_KMEANS Apply K-means to detect recurring symptom patterns over time
% Usage:
%   sop1_kmeans;                          % defaults, auto dataset
%   sop1_kmeans('C:/path/to/project', 4); % custom root and K

if nargin < 1 || isempty(projectRoot)
    here = fileparts(mfilename('fullpath'));
    projectRoot = fileparts(here);
end
if nargin < 2 || isempty(K)
    K = 4;
end
if nargin < 3 || isempty(distance)
    distance = 'sqeuclidean';
end

addpath(genpath(fullfile(projectRoot, 'matlab', 'utils')));

% Optional Name-Value controls
p = inputParser; p.FunctionName = 'sop1_kmeans';
addParameter(p, 'UseLabelInit', false, @(x) islogical(x) || isnumeric(x));
addParameter(p, 'WeightSymptoms', 2.0, @(x) isnumeric(x) && isscalar(x) && x>0);
addParameter(p, 'WeightConditions', 1.5, @(x) isnumeric(x) && isscalar(x) && x>0);
addParameter(p, 'WeightAge', 1.0, @(x) isnumeric(x) && isscalar(x) && x>0);
addParameter(p, 'WeightGender', 1.0, @(x) isnumeric(x) && isscalar(x) && x>0);
addParameter(p, 'WeightCommunity', 1.0, @(x) isnumeric(x) && isscalar(x) && x>0);
addParameter(p, 'Replicates', 20, @(x) isnumeric(x) && isscalar(x) && x>=1);
addParameter(p, 'MaxIter', 300, @(x) isnumeric(x) && isscalar(x) && x>=50);
nv = varargin; for i=1:2:numel(nv), if i<=numel(nv) && (isstring(nv{i})||ischar(nv{i})), nv{i}=char(nv{i}); end, end
parse(p, nv{:}); soptsUser = p.Results;

outDir = fullfile(projectRoot, 'matlab', 'results', 'project_evaluation', 'sop1');
if ~exist(outDir, 'dir')
    mkdir(outDir);
end

% 1) Load or synthesize dataset
T = readOrGenerateDataset(projectRoot);

% 2) Preprocess (increase vocab breadth to improve separability)
[X, featureNames, labelVec, timeVec, meta] = preprocessData(T, "TopSymptoms", 40, "TopConditions", 30, "Standardize", true);

% 2b) Apply feature weights to emphasize more informative groups
W = buildFeatureWeights(featureNames, soptsUser);
X = X .* W;

% 3) Run K-means with smarter init if labels available and requested
C0 = [];
if soptsUser.UseLabelInit && ~isempty(labelVec)
    classes = categories(categorical(labelVec));
    K = numel(classes);
    C0 = zeros(K, size(X,2));
    for k = 1:K
        mask = categorical(labelVec) == classes{k};
        if any(mask)
            C0(k,:) = mean(X(mask,:),1);
        else
            C0(k,:) = X(randi(size(X,1)),:);
        end
    end
end

try
    opts = statset('Display','final', 'MaxIter', soptsUser.MaxIter, 'UseParallel', true);
    if ~isempty(C0)
        [idx, C] = kmeans(X, K, 'Distance', distance, 'Start', C0, 'Options', opts);
    else
        [idx, C] = kmeans(X, K, 'Distance', distance, 'Replicates', soptsUser.Replicates, 'Options', opts);
    end
catch
    if ~isempty(C0)
        [idx, C] = simple_kmeans_lloyd(X, K, soptsUser.MaxIter, C0);
    else
        [idx, C] = simple_kmeans_lloyd_best(X, K, soptsUser.MaxIter, max(1, round(soptsUser.Replicates)));
    end
end

% 4) Metrics
metrics = computeClusteringMetrics(X, idx, C, distance);

% 5) Visualizations
% PCA to 2D for visualization (toolbox-free approximation via SVD)
try
    [coeff, score, ~, ~, explained] = pca(X);
catch
    Xc = X - mean(X,1);
    [U,S,V] = svd(Xc,'econ');
    score = U(:,1:2) * S(1:2,1:2);
    varExpl = diag(S).^2;
    explained = 100 * varExpl / sum(varExpl);
end
fig1 = figure('Visible','off');
hold on;
colors = lines(K);
for kk = 1:K
    mask = (idx == kk);
    scatter(score(mask,1), score(mask,2), 20, colors(kk,:), 'filled');
end
xlabel(sprintf('PC1 (%.1f%%)', explained(1))); ylabel(sprintf('PC2 (%.1f%%)', explained(2)));
title(sprintf('K-means Clusters (K=%d) - PCA View', K)); grid on;
legend(compose('Cluster %d', 1:K), 'Location','bestoutside');
saveFigure(fig1, outDir, 'sop1_kmeans_pca_clusters');

% Cluster distribution over time (by month)
months = dateshift(timeVec, 'start', 'month');
cTabs = groupsummary(table(months, idx), 'months', 'mode', 'idx'); %#ok<MCHGRP>
fig2 = figure('Visible','off');
tab = groupsummary(table(months, idx), {'months','idx'});
unqMonths = unique(tab.months);
unqIdx = unique(tab.idx);
M = zeros(numel(unqMonths), numel(unqIdx));
for i = 1:numel(unqMonths)
    for j = 1:numel(unqIdx)
        mask = (tab.months==unqMonths(i) & tab.idx==unqIdx(j));
        if any(mask)
            M(i,j) = tab.GroupCount(mask);
        end
    end
end
area(datenum(unqMonths), M);
datetick('x','mmm-yyyy');
legend(compose('Cluster %d', unqIdx), 'Location','eastoutside');
title('Cluster Distribution Over Time'); xlabel('Month'); ylabel('Count'); grid on;
saveFigure(fig2, outDir, 'sop1_kmeans_time_distribution');

% Silhouette plot
fig3 = figure('Visible','off');
try
    silhouette(X, idx, 'sqeuclidean');
    title(sprintf('Silhouette Plot (mean=%.3f)', metrics.silhouetteMean));
catch
    bar(metrics.clusterSizes);
    title(sprintf('Cluster Sizes (silhouette proxy=%.3f)', metrics.silhouetteMean));
    xlabel('Cluster'); ylabel('Count'); grid on;
end
saveFigure(fig3, outDir, 'sop1_kmeans_silhouette_or_sizes');

% Top features per cluster (centroid feature weights)
fig4 = figure('Visible','off');
% Flatten featureNames robustly (handles row/column cell arrays)
flatCells = {};
for ii = 1:numel(featureNames)
    c = featureNames{ii};
    if isstring(c)
        c = cellstr(c);
    end
    if isrow(c)
        c = c';
    end
    flatCells = [flatCells; c]; %#ok<AGROW>
end
allNames = string(flatCells);
numTop = min(10, numel(allNames));
for k = 1:K
    subplot(ceil(K/2), 2, k);
    [vals, order] = maxk(C(k,:), numTop);
    barh(vals);
    yticklabels(cellstr(allNames(order)));
    ytickangle(0);
    title(sprintf('Cluster %d: top features', k));
end
sgtitle('Centroid Top Features');
saveFigure(fig4, outDir, 'sop1_kmeans_top_features');

% 6) Optional accuracy vs label if label exists
acc = [];
try
    if ~isempty(labelVec)
        acc = computeClusteringAccuracy(labelVec, idx);
    end
catch
    acc = [];
end

% 7) Save results
result = struct();
result.K = K;
result.distance = distance;
result.metrics = metrics;
result.featureNames = featureNames;
result.meta = meta;
result.clusterIdx = idx;
result.centroids = C;
result.accuracy = acc;
result.options = soptsUser;

save(fullfile(outDir, 'sop1_kmeans_result.mat'), '-struct', 'result');

% CSV summary
summaryTbl = table((1:K)', metrics.clusterSizes, 'VariableNames', {'Cluster','Size'});
writetable(summaryTbl, fullfile(outDir, 'sop1_cluster_sizes.csv'));

% Print simple console report
fprintf('K-means complete. Inertia=%.2f, Silhouette=%.3f\n', metrics.inertia, metrics.silhouetteMean);
fprintf('Cluster sizes: %s\n', mat2str(metrics.clusterSizes'));
if ~isempty(acc)
    fprintf('Cluster-label purity accuracy: %.3f\n', acc.purity);
end

end

function [idx, C] = simple_kmeans_lloyd(X, K, maxIter)
% Simple Lloyd's k-means (Euclidean), toolbox-free
if nargin < 3, maxIter = 100; end
N = size(X,1);
perm = randperm(N, K);
C = X(perm, :);
idx = ones(N,1);
for it = 1:maxIter
    % assign
    D2 = (X.^2)*ones(size(X,2),K) + ones(N,1)*(sum(C.^2,2)') - 2*(X*C');
    [~, idx] = min(D2, [], 2);
    % update
    Cnew = zeros(size(C));
    for k = 1:K
        mask = (idx == k);
        if any(mask)
            Cnew(k,:) = mean(X(mask,:), 1);
        else
            Cnew(k,:) = X(randi(N),:);
        end
    end
    if norm(Cnew - C, 'fro') < 1e-6
        C = Cnew; break
    end
    C = Cnew;
end
end


function [bestIdx, bestC] = simple_kmeans_lloyd_best(X, K, maxIter, replicates)
% Multiple restarts of simple k-means; choose lowest inertia
if nargin < 4, replicates = 5; end
bestIdx = []; bestC = [];
bestInertia = inf;
for r = 1:replicates
    [idx, C] = simple_kmeans_lloyd(X, K, maxIter);
    D2 = (X.^2)*ones(size(X,2),K) + ones(size(X,1),1)*(sum(C.^2,2)') - 2*(X*C');
    inertia = 0;
    for k = 1:K
        inertia = inertia + sum(D2(idx==k, k));
    end
    if inertia < bestInertia
        bestInertia = inertia; bestIdx = idx; bestC = C;
    end
end
end

function W = buildFeatureWeights(featureNames, sopts)
% Build per-feature weights based on name prefixes
names = {};
for ii=1:numel(featureNames)
    n = featureNames{ii};
    if isstring(n), n = cellstr(n); end
    if isrow(n), n = n'; end
    names = [names; n]; %#ok<AGROW>
end
names = string(names);
W = ones(1, numel(names));
for j=1:numel(names)
    nm = lower(names(j));
    if startsWith(nm, "sym_")
        W(j) = sopts.WeightSymptoms;
    elseif startsWith(nm, "cond_")
        W(j) = sopts.WeightConditions;
    elseif strcmp(nm, "age")
        W(j) = sopts.WeightAge;
    elseif startsWith(nm, "gender_")
        W(j) = sopts.WeightGender;
    elseif startsWith(nm, "community_")
        W(j) = sopts.WeightCommunity;
    end
end
end


