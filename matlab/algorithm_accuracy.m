root = 'C:/Users/aldri/OneDrive/Desktop/THESIS-2';
addpath(genpath(fullfile(root,'matlab','utils')));

% 1) Load SOP1 results
R = load(fullfile(root,'matlab','results','project_evaluation','sop1','sop1_kmeans_result.mat'));
idx = R.clusterIdx(:);
K   = max(idx);                           % ensure K matches assignments
vocab = string(R.meta.pastVocab(:));      % Dx1 string (conditions)

% 2) Load dataset
T = readOrGenerateDataset(root);

% Locate PastConditions column once
vn = T.Properties.VariableNames;
lc = lower(vn);
colPast = find(ismember(lc, {'pastconditions','past_conditions','medical_history'}),1);

% 3) Build presence matrix P for conditions
N = height(T); D = numel(vocab);
P = false(N, D);
if ~isempty(colPast)
    for i = 1:N
        pc = string(T{i,colPast});
        toks = lower(strtrim(split(pc, {',',';','|','/'})));
        toks(toks=="") = [];
        if ~isempty(toks)
            [tf,pos] = ismember(toks, vocab);
            pos = pos(tf & pos>0);
            if ~isempty(pos), P(i,unique(pos)) = true; end
        end
    end
end

% 4) Per-condition metrics
cond         = vocab;                  % Dx1
occurrences  = zeros(D,1);
bestCluster  = zeros(D,1);
purity       = zeros(D,1);             % recall (coverage of top cluster)
precision    = zeros(D,1);

clusterSizes = accumarray(idx, 1, [K 1]);

for j = 1:D
    rows = find(P(:,j));
    occurrences(j) = numel(rows);
    if occurrences(j) == 0, bestCluster(j) = 0; purity(j) = NaN; precision(j) = NaN; continue; end
    counts = accumarray(idx(rows), 1, [K 1]);     % occurrences by cluster
    [mx, c] = max(counts);
    bestCluster(j) = c;
    purity(j) = mx / occurrences(j);
    precision(j) = counts(c) / max(clusterSizes(c), 1);
end

% 5) Summaries
valid = occurrences > 0 & ~isnan(purity) & ~isnan(precision);
macroPurity    = mean(purity(valid), 'omitnan');
macroPrecision = mean(precision(valid), 'omitnan');

num = 0; den = 0;
for j = 1:D
    if occurrences(j) == 0, continue; end
    counts = accumarray(idx(P(:,j)), 1, [K 1]);
    num = num + max(counts);
    den = den + occurrences(j);
end
microPurity = num / max(den, 1);

fprintf('Per-condition MACRO purity: %.3f\n', macroPurity);
fprintf('Per-condition MACRO precision: %.3f\n', macroPrecision);
fprintf('Per-condition MICRO purity: %.3f\n', microPurity);

% 6) Add F1, sort, and save table
f1 = 2*(precision.*purity) ./ max(precision + purity, eps);
bestCluster(bestCluster==0) = NaN;  % clearer for conditions with 0 occurrences

Tsum = table(cond, occurrences, bestCluster, purity, precision, f1, ...
    'VariableNames', {'Condition','Occurrences','BestCluster','Purity','Precision','F1'});
Tsum = sortrows(Tsum, {'Occurrences','F1'}, {'descend','descend'});

outDir = fullfile(root,'matlab','results','project_evaluation','sop1');
writetable(Tsum, fullfile(outDir,'condition_cluster_assignment_summary.csv'));
disp(head(Tsum, 15));

% 7) Report accuracy in percentage and save overall metrics
macroF1 = mean(f1(valid), 'omitnan');
overallTbl = table(macroPurity*100, macroPrecision*100, macroF1*100, microPurity*100, ...
    'VariableNames', {'MacroPurityPct','MacroPrecisionPct','MacroF1Pct','MicroPurityPct'});
writetable(overallTbl, fullfile(outDir,'overall_condition_accuracy_metrics.csv'));
fprintf('Macro Purity: %.2f%%\n', overallTbl.MacroPurityPct);
fprintf('Macro Precision: %.2f%%\n', overallTbl.MacroPrecisionPct);
fprintf('Macro F1: %.2f%%\n', overallTbl.MacroF1Pct);
fprintf('Micro Purity (overall accuracy): %.2f%%\n', overallTbl.MicroPurityPct);

% 8) Visualizations
% 8a) Bar of overall percentages
fig1 = figure('Visible','off');
vals = [overallTbl.MacroPurityPct, overallTbl.MacroPrecisionPct, overallTbl.MacroF1Pct, overallTbl.MicroPurityPct];
bar(vals);
set(gca,'XTickLabel',{'Macro Purity','Macro Precision','Macro F1','Micro Purity'});
ylabel('Percentage (%)'); grid on; ylim([0,100]);
title('Overall Condition-Level Accuracy Metrics');
saveFigure(fig1, outDir, 'overall_condition_accuracy_metrics');

% 8b) Scatter: per-condition Purity vs Precision (bubble size = Occurrences)
fig2 = figure('Visible','off'); hold on; grid on;
% Select top 25 by occurrences to avoid clutter
[~, ordOcc] = sort(Tsum.Occurrences, 'descend');
pick = ordOcc(1:min(25, height(Tsum)));
sz = 10 + 80*(Tsum.Occurrences(pick) ./ max(Tsum.Occurrences(pick)));
scatter(Tsum.Purity(pick), Tsum.Precision(pick), sz, 'filled');
xlabel('Purity'); ylabel('Precision'); xlim([0 1]); ylim([0 1]);
title('Top Conditions: Purity vs Precision');
for i = 1:numel(pick)
    text(Tsum.Purity(pick(i))+0.02, Tsum.Precision(pick(i)), Tsum.Condition(pick(i)), 'FontSize', 7);
end
saveFigure(fig2, outDir, 'conditions_purity_vs_precision_top');

% 8c) Horizontal bar: Top 20 F1 conditions
fig3 = figure('Visible','off');
[~, ordF1] = sort(f1, 'descend');
ordF1 = ordF1(1:min(20, numel(ordF1)));
barh(f1(ordF1));
yticks(1:numel(ordF1)); yticklabels(Tsum.Condition(ordF1));
xlabel('F1'); xlim([0 1]); grid on;
title('Top Conditions by F1');
saveFigure(fig3, outDir, 'conditions_top_f1');