export function estimateCost(inputCostPerM, outputCostPerM, promptTokens, completionTokens) {
  if (promptTokens == null || completionTokens == null) return null;
  if (inputCostPerM == null || outputCostPerM == null) return null;

  const inputCost = (promptTokens / 1_000_000) * inputCostPerM;
  const outputCost = (completionTokens / 1_000_000) * outputCostPerM;
  return Number((inputCost + outputCost).toFixed(6));
}