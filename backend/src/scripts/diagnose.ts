#!/usr/bin/env node
/**
 * API Key Diagnostic Tool
 * Tests each API to identify which one is returning 401
 */

import 'dotenv/config';
import { CohereClient } from 'cohere-ai';
import { Pinecone } from '@pinecone-database/pinecone';
import axios from 'axios';

const config = {
  cohereApiKey: process.env.COHERE_API_KEY || '',
  pineconeApiKey: process.env.PINECONE_API_KEY || '',
  pineconeIndex: process.env.PINECONE_INDEX || 'repolens-chunks',
  githubToken: process.env.GITHUB_TOKEN || '',
};

const testCohere = async () => {
  console.log('\n🧪 Testing Cohere API...');
  try {
    const cohere = new CohereClient({ token: config.cohereApiKey });
    const response = await cohere.embed({
      texts: ['test'],
      model: 'embed-english-v3.0',
      inputType: 'search_document',
    });
    console.log('✅ Cohere API: OK');
    return true;
  } catch (err: any) {
    console.error(`❌ Cohere API FAILED: ${err.message}`);
    if (err.status === 401 || err.status === 403) {
      console.log('   → Check: COHERE_API_KEY is valid and has correct permissions');
    }
    return false;
  }
};

const testPinecone = async () => {
  console.log('\n🧪 Testing Pinecone API...');
  try {
    const pinecone = new Pinecone({ apiKey: config.pineconeApiKey });
    const index = pinecone.index(config.pineconeIndex);
    const stats = await index.describeIndexStats();
    console.log('✅ Pinecone API: OK');
    console.log(`   → Index: ${config.pineconeIndex}`);
    console.log(`   → Namespaces: ${stats.namespaces ? Object.keys(stats.namespaces).length : 0}`);
    return true;
  } catch (err: any) {
    console.error(`❌ Pinecone API FAILED: ${err.message}`);
    if (err.status === 401 || err.message.includes('401')) {
      console.log('   → Check: PINECONE_API_KEY is valid');
      console.log('   → Check: PINECONE_INDEX exists and matches env var');
    }
    return false;
  }
};

const testGithub = async () => {
  console.log('\n🧪 Testing GitHub API...');
  try {
    const githubApi = axios.create({
      baseURL: 'https://api.github.com',
      headers: {
        Accept: 'application/vnd.github+json',
        ...(config.githubToken && { Authorization: `Bearer ${config.githubToken}` }),
      },
    });

    const response = await githubApi.get('/repos/torvalds/linux');
    console.log('✅ GitHub API: OK');
    if (config.githubToken) {
      console.log('   → Token: Present');
    } else {
      console.log('   → Token: Not set (read-only, rate-limited)');
    }
    return true;
  } catch (err: any) {
    console.error(`❌ GitHub API FAILED: ${err.message}`);
    if (err.response?.status === 401) {
      console.log('   → Check: GITHUB_TOKEN is valid');
    }
    return false;
  }
};

const main = async () => {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║         API Key Diagnostic Tool                                ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');

  const results = {
    cohere: false,
    pinecone: false,
    github: false,
  };

  results.cohere = await testCohere();
  results.pinecone = await testPinecone();
  results.github = await testGithub();

  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║                         SUMMARY                                ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');

  const failedApis = Object.entries(results)
    .filter(([_, ok]) => !ok)
    .map(([name]) => name);

  if (failedApis.length === 0) {
    console.log('\n✅ All APIs are working!');
    console.log('\nThe 401 error might be coming from:');
    console.log('  1. An expired/invalid token (try regenerating)');
    console.log('  2. API rate limits exceeded');
    console.log('  3. GitHub repo access restrictions');
    console.log('\nTry ingesting a public repo: https://github.com/octocat/Hello-World');
  } else {
    console.log(`\n❌ Failed APIs: ${failedApis.join(', ')}`);
    console.log('\nQuick fixes:');
    if (failedApis.includes('cohere')) {
      console.log('  • Cohere: Get key from https://dashboard.cohere.com/api-keys');
    }
    if (failedApis.includes('pinecone')) {
      console.log('  • Pinecone: Get key from https://console.pinecone.io/');
    }
    if (failedApis.includes('github')) {
      console.log('  • GitHub: Get token from https://github.com/settings/tokens');
    }
  }
};

main().catch(console.error);
