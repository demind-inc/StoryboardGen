import React from "react";
import { SceneResult } from "../../types";
import Results from "../Results/Results";

export interface ResultsCardProps {
  results: SceneResult[];
  isGenerating: boolean;
  onRegenerateResult: (index: number) => void;
  onRegenerateAll: () => void;
  captions: { tiktok: string; instagram: string };
  projectName: string;
}

const ResultsCard: React.FC<ResultsCardProps> = ({
  results,
  isGenerating,
  onRegenerateResult,
  onRegenerateAll,
  captions,
  projectName,
}) => (
  <Results
    mode="manual"
    results={results}
    isGenerating={isGenerating}
    onRegenerate={onRegenerateResult}
    onRegenerateAll={onRegenerateAll}
    captions={captions}
    projectName={projectName}
  />
);

export default ResultsCard;
