function acc = computeClusteringAccuracy(yTrue, idx)
%COMPUTERCLUSTERINGACCURACY Purity-style accuracy for clustering vs labels
% Inputs:
%   yTrue - ground truth labels (categorical/char/string/numeric)
%   idx   - cluster assignments (1..K)
% Output:
%   acc   - struct with fields:
%             purity           - overall accuracy after majority mapping
%             labels           - label categories used
%             clusterToLabel   - [K x 1] mapped majority label per cluster
%             confusion        - counts matrix [numLabels x K]

% normalize types and shapes
if ~iscategorical(yTrue)
    yTrue = categorical(string(yTrue));
end
yTrue = yTrue(:);
idx = idx(:);

labels = categories(yTrue);
K = max(idx);
L = numel(labels);

% confusion counts: label x cluster
conf = zeros(L, K);
for i = 1:numel(yTrue)
    li = find(strcmp(labels, cellstr(yTrue(i))), 1);
    ki = idx(i);
    if ~isempty(li) && ~isempty(ki) && ki>=1 && ki<=K
        conf(li, ki) = conf(li, ki) + 1;
    end
end

% map each cluster to its majority label
clusterToLabel = strings(K,1);
for k = 1:K
    [~, li] = max(conf(:,k));
    if isempty(li) || li < 1
        clusterToLabel(k) = "";
    else
        clusterToLabel(k) = string(labels{li});
    end
end

% predicted labels according to mapping
ypred = strings(numel(idx),1);
for i = 1:numel(idx)
    k = idx(i);
    if k>=1 && k<=K
        ypred(i) = clusterToLabel(k);
    else
        ypred(i) = "";
    end
end
ypred = categorical(ypred, labels);

% purity accuracy
purity = mean(ypred == yTrue);

acc = struct();
acc.purity = purity;
acc.labels = labels;
acc.clusterToLabel = clusterToLabel;
acc.confusion = conf;

end


