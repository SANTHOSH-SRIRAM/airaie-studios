import React, { useState } from 'react';
import GoldenDatasetManager from '@components/evals/GoldenDatasetManager';
import TestCaseEditor from '@components/evals/TestCaseEditor';
import EvalRunner from '@components/evals/EvalRunner';
import AccuracyScoring from '@components/evals/AccuracyScoring';

interface EvalResult {
  testCaseId: string;
  passed: boolean;
  score: number;
  cost: number;
  actionCount: number;
  details: string;
}

export default function EvalsPage() {
  const [editingTestCaseId, setEditingTestCaseId] = useState<string | null | undefined>(undefined);
  const [evalResults, setEvalResults] = useState<EvalResult[]>([]);

  const showEditor = editingTestCaseId !== undefined;

  return (
    <div className="p-6 space-y-6">
      {showEditor ? (
        <TestCaseEditor
          testCaseId={editingTestCaseId}
          onSave={() => setEditingTestCaseId(undefined)}
          onCancel={() => setEditingTestCaseId(undefined)}
        />
      ) : (
        <>
          <GoldenDatasetManager onEdit={(id) => setEditingTestCaseId(id)} />
          <EvalRunner onResults={setEvalResults} />
          <AccuracyScoring results={evalResults} />
        </>
      )}
    </div>
  );
}
