function filepath = saveFigure(figHandle, outDir, baseName)
%SAVEFIGURE Save figure in PNG and FIG formats with safe name

if ~exist(outDir, 'dir')
    mkdir(outDir);
end

ts = datestr(now, 'yyyymmdd_HHMMSS');
safeName = regexprep(baseName, '[^a-zA-Z0-9_-]', '_');

pngPath = fullfile(outDir, sprintf('%s_%s.png', safeName, ts));
figPath = fullfile(outDir, sprintf('%s_%s.fig', safeName, ts));

saveas(figHandle, pngPath);
savefig(figHandle, figPath);

if nargout > 0
    filepath = pngPath;
end

end


