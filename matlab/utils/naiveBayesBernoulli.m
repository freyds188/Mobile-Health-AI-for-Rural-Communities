function model = naiveBayesBernoulliTrain(Xbin, y, alpha)
%NAIVEBAYESBERNOULLITRAIN Train a Bernoulli Naive Bayes classifier
% Inputs:
%   Xbin  - [N x D] binary features (0/1)
%   y     - categorical labels [N x 1]
%   alpha - Laplace smoothing (e.g., 1)
% Output:
%   model - struct with fields: classes, logPrior, logP, logOneMinusP

if ~iscategorical(y)
    y = categorical(string(y));
end
classes = categories(y);
N = size(Xbin,1); D = size(Xbin,2);

logPrior = zeros(numel(classes),1);
logP = zeros(numel(classes), D);
logOneMinusP = zeros(numel(classes), D);

for ci = 1:numel(classes)
    mask = (y == classes{ci});
    Nc = sum(mask);
    logPrior(ci) = log(max(Nc,1)) - log(N);
    % feature probabilities with Laplace smoothing
    count1 = sum(Xbin(mask,:), 1);
    p = (count1 + alpha) ./ (Nc + 2*alpha);
    % numerical safety
    p = min(max(p, 1e-9), 1-1e-9);
    logP(ci,:) = log(p);
    logOneMinusP(ci,:) = log(1 - p);
end

model = struct();
model.classes = classes;
model.logPrior = logPrior;
model.logP = logP;
model.logOneMinusP = logOneMinusP;

end

function ypred = naiveBayesBernoulliPredict(model, Xbin)
%NAIVEBAYESBERNOULLIPREDICT Predict labels for Bernoulli Naive Bayes
% Inputs:
%   model - from naiveBayesBernoulliTrain
%   Xbin  - [N x D] binary features (0/1)
% Output:
%   ypred - categorical predictions [N x 1]

N = size(Xbin,1);
C = numel(model.classes);
logScore = repmat(model.logPrior', N, 1);

for ci = 1:C
    % sum over features: x*logP + (1-x)*log(1-P)
    s = Xbin * model.logP(ci,:)' + (1 - Xbin) * model.logOneMinusP(ci,:)';
    logScore(:,ci) = logScore(:,ci) + s;
end

[~, idx] = max(logScore, [], 2);
ypred = categorical(model.classes(idx), model.classes);

end


