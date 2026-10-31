// The words of the usage of the user.
export const usageMessages = {
  /** The name of the bar of the budget of the month, for assistive technology. */
  monthlyBudget: 'Monthly budget used',
  /** The cost of the month against its budget, both written as amounts: "$4.76 / $5.52". */
  spentOfBudget: (spent: string, budget: string) => `${spent} / ${budget}`,
}
