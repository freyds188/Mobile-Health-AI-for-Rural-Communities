function metrics = computeClusteringMetrics(X, idx, C, distance)
%COMPUTECLUSTERINGMETRICS Compute inertia, silhouette score, cluster sizes
% Inputs:
%   X        - [N x D] features
%   idx      - [N x 1] cluster assignment (1..K)
%   C        - [K x D] centroids
%   distance - distance metric used (e.g., 'sqeuclidean')
% Output:
%   metrics  - struct with fields: inertia, silhouetteMean, clusterSizes

if nargin < 4 || isempty(distance)
    distance = 'sqeuclidean';
end

K = size(C,1);

% Inertia as sum of within-cluster squared distances (toolbox-free)
d2 = localSquaredDistances(X, C);
inertia = 0;
for k = 1:K
    mask = (idx == k);
    inertia = inertia + sum(d2(mask, k));
end

try
    sil = silhouette(X, idx, 'sqeuclidean');
    metrics.silhouetteMean = mean(sil, 'omitnan');
catch
    % If silhouette is unavailable (toolbox missing), compute a simple
    % proxy: average distance ratio (within vs nearest other centroid)
    D2 = localSquaredDistances(X, C);
    within = zeros(size(X,1),1);
    nearestOther = zeros(size(X,1),1);
    for i = 1:size(X,1)
        k = idx(i);
        within(i) = sqrt(max(D2(i,k), 0));
        row = D2(i,:);
        row(k) = inf;
        nearestOther(i) = sqrt(min(row));
    end
    ratio = 1 - within ./ max(nearestOther, eps);
    metrics.silhouetteMean = mean(ratio, 'omitnan');
end
metrics.inertia = inertia;

% Cluster sizes
cs = zeros(K,1);
for k = 1:K
    cs(k) = sum(idx == k);
end
metrics.clusterSizes = cs;

end

function D2 = localSquaredDistances(A, B)
% Compute squared Euclidean distances between rows of A [N x D] and B [K x D]
% D2 is [N x K]
N = size(A,1);
K = size(B,1);
AA = sum(A.^2, 2);
BB = sum(B.^2, 2)';
D2 = bsxfun(@plus, AA, BB) - 2*(A*B');
% numerical floor
D2(D2 < 0) = 0;
if any(~isfinite(D2), 'all')
    % fallback loop (rare)
    D2 = zeros(N,K);
    for i = 1:N
        for k = 1:K
            diff = A(i,:) - B(k,:);
            D2(i,k) = sum(diff.^2);
        end
    end
end
end

