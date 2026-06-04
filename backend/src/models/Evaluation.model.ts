import mongoose, { Document, Schema } from 'mongoose';

export interface EvaluationDocument extends Document {
  repositoryUrl: string;
  strategyType: 'fixed' | 'ast';
  hitRate: number;
  mrr: number;
  faithfulness: number;
  answerRelevancy: number;
  latency: number;
  totalQuestions: number;
  timestamp: Date;
  notes?: string;
}

const evaluationSchema = new Schema<EvaluationDocument>({
  repositoryUrl: { type: String, required: true, index: true },
  strategyType: { type: String, enum: ['fixed', 'ast'], required: true },
  hitRate: { type: Number, required: true, min: 0, max: 1 },
  mrr: { type: Number, required: true, min: 0, max: 1 },
  faithfulness: { type: Number, required: true, min: 0, max: 1 },
  answerRelevancy: { type: Number, required: true, min: 0, max: 1 },
  latency: { type: Number, required: true },
  totalQuestions: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now, index: true },
  notes: String,
});

// Compound index for querying results by repo and strategy
evaluationSchema.index({ repositoryUrl: 1, strategyType: 1, timestamp: -1 });

export const EvaluationModel = mongoose.model<EvaluationDocument>(
  'Evaluation',
  evaluationSchema,
  'evaluations'
);
