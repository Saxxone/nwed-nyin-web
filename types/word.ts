import type { DateString } from "./types";
import type { User } from "@/types/user";

export interface Word {
  id?: string;
  term: string;
  pronunciation?: string | null;
  etymology?: string | null;
  alt_spelling: string | null;
  created_at?: DateString;
  updated_at?: DateString;
  deleted_at?: DateString | null;
  definitions: Definition[];
  contributors?: User[];
  related_from?: WordRelation[];
  related_to?: WordRelation[];
  [key: string]: any;
}

export interface Definition {
  id?: string;
  word_id?: string;
  part_of_speech_id?: string;
  meaning: string;
  order: null | number;
  created_at?: string;
  updated_at?: string;
  part_of_speech: PartOfSpeech;
  examples: Example[];
  synonyms: Synonym[];
  antonyms: Antonym[];
  [key: string]: any;
}

export interface PartOfSpeech {
  id: string;
  name: string;
}

export interface Example {
  id?: string;
  definition_id?: string;
  sentence: string;
  created_at?: string;
  updated_at?: string;
}

export interface Synonym {
  id?: string;
  definition_id?: string;
  synonym: string;
}

export interface Antonym {
  id?: string;
  definition_id?: string;
  antonym: string;
}

export interface WordRelation {
  id: string;
  word_from: Word;
  from_id: string;
  word_to: Word;
  to_id: string;
  type: RelationType;
}

export enum RelationType {
  VARIANT = "VARIANT",
  DERIVED = "DERIVED",
  COMPOUND = "COMPOUND",
  ROOT = "ROOT",
}
