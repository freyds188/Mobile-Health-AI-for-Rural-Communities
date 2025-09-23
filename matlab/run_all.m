function run_all(projectRoot)
%RUN_ALL Execute SOP1 and SOP3 with default settings and save outputs
% Usage: run_all; or run_all('C:/path/to/project')

if nargin < 1 || isempty(projectRoot)
    here = fileparts(mfilename('fullpath'));
    projectRoot = fileparts(here);
end

addpath(genpath(fullfile(projectRoot, 'matlab')));

% SOP1: K-means
fprintf('Running SOP1 K-means...\n');
sop1_kmeans(projectRoot, 4, 'sqeuclidean');

% SOP3: Classification
fprintf('Running SOP3 Classification...\n');
sop3_classification(projectRoot, {"svm","tree"});

fprintf('All tasks complete. See results under matlab/results/project_evaluation/.\n');

end


