export interface Word {
  term: string;
  alt_spelling?: string;
  pronunciation: string;
  definitions: Definition[];
  synonyms: string[];
}

export interface Definition {
  meaning: string;
  examples: string[];
  part_of_speech: string;
  links: Link[];
}

export interface Link {
  target: string;
  text: string;
}
