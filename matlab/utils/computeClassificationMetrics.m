function metrics = computeClassificationMetrics(yTrue, yPred, classOrder)
%COMPUTECLASSIFICATIONMETRICS Accuracy, Precision, Recall, F1, Confusion
% Inputs:
%   yTrue, yPred    - categorical/char/string/ numeric vectors (same size)
%   classOrder      - optional explicit class order for confusion matrix
% Output:
%   metrics         - struct with fields: accuracy, precision, recall, f1,
%                     confusionMat, classes

% Normalize to categorical
if ~iscategorical(yTrue)
    yTrue = categorical(string(yTrue));
end
if ~iscategorical(yPred)
    yPred = categorical(string(yPred));
end

if nargin < 3 || isempty(classOrder)
    classes = union(categories(yTrue), categories(yPred));
else
    classes = categorical(classOrder);
end

% Confusion matrix (toolbox-free)
yt = double(grp2idx(categorical(yTrue, classes)));
yp = double(grp2idx(categorical(yPred, classes)));
numC = numel(classes);
cm = zeros(numC, numC);
for i = 1:numel(yt)
    if yt(i) >= 1 && yt(i) <= numC && yp(i) >= 1 && yp(i) <= numC
        cm(yt(i), yp(i)) = cm(yt(i), yp(i)) + 1;
    end
end

% Metrics per class (macro-average)
tp = diag(cm);
fp = sum(cm,1)' - tp;
fn = sum(cm,2) - tp;
tn = sum(cm,'all') - (tp + fp + fn);

precisionPerClass = tp ./ max(tp + fp, eps);
recallPerClass = tp ./ max(tp + fn, eps);
f1PerClass = 2 .* (precisionPerClass .* recallPerClass) ./ max(precisionPerClass + recallPerClass, eps);

metrics.precision = mean(precisionPerClass);
metrics.recall = mean(recallPerClass);
metrics.f1 = mean(f1PerClass);
metrics.accuracy = sum(tp) / max(sum(cm,'all'), eps);
metrics.confusionMat = cm;
metrics.classes = categories(classes);

end


