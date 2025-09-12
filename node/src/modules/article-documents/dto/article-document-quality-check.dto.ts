import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsInt,
} from 'class-validator';

export enum QualityCheckType {
  GRAMMAR = 'grammar',
  CLICHES = 'cliches',
  BREVITY = 'brevity',
  READABILITY = 'readability',
  PASSIVE_VOICE = 'passive_voice',
  CONFIDENCE = 'confidence',
  CITATION = 'citation',
  REPETITION = 'repetition',
}

export class ArticleDocumentQualityCheckDto {
  @IsEnum(QualityCheckType)
  check_type!: QualityCheckType;

  @IsString()
  @IsNotEmpty()
  text!: string; // section/paragraph to check


}
