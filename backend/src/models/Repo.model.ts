import mongoose, { Schema, Document } from 'mongoose';

export interface IRepo extends Document {
  repoUrl: string;
  owner: string;
  repo: string;
  defaultBranch: string;
  fileCount: number;
  status: 'pending' | 'ingested' | 'failed';
  ingestedAt: Date;
}

const RepoSchema = new Schema<IRepo>({
  repoUrl: { type: String, required: true, unique: true },
  owner: { type: String, required: true },
  repo: { type: String, required: true },
  defaultBranch: { type: String, default: 'main' },
  fileCount: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['pending', 'ingested', 'failed'],
    default: 'pending',
  },
  ingestedAt: { type: Date },
});

export const RepoModel = mongoose.model<IRepo>('Repo', RepoSchema);