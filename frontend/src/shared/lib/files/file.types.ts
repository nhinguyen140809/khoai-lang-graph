/** Why a file cannot be taken: its format is not one that is accepted, or it is larger than the limit. */
export type FileProblem = 'unsupported_format' | 'too_large'
