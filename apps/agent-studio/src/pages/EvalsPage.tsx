import React, { useState } from 'react';
import { Group, Panel, Separator } from 'react-resizable-panels';
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
  const [editingTestCaseId, setEditingTestCaseId] = useState<string | null>(null);
  const [evalResults, setEvalResults] = useState<EvalResult[]>([]);

  const showEditor = editingTestCaseId !== null;

  return (
    <div className="h-full w-full overflow-hidden">
      <Group orientation="horizontal" id="evals-panels" className="h-full w-full">
        {/* Test cases list (left) */}
        <Panel id="evals-list" defaultSize="28%" minSize="20%" maxSize="40%">
          <div className="h-full border-r border-gray-200 overflow-auto">
            <GoldenDatasetManager onEdit={(id) => setEditingTestCaseId(id)} />
          </div>
        </Panel>

        <Separator className="w-px bg-gray-200 hover:bg-blue-400 active:bg-blue-500 transition-colors" />

        {/* Editor / runner (center) */}
        <Panel id="evals-editor" defaultSize="42%" minSize="30%">
          <div className="h-full overflow-auto p-4">
            {showEditor ? (
              <TestCaseEditor
                testCaseId={editingTestCaseId}
                onSave={() => setEditingTestCaseId(null)}
                onCancel={() => setEditingTestCaseId(null)}
              />
            ) : (
              <div className="space-y-4">
                <EvalRunner onResults={setEvalResults} />
                <div className="text-xs text-gray-400 text-center mt-8">
                  Select a test case to edit, or run all evaluations.
                </div>
              </div>
            )}
          </div>
        </Panel>

        <Separator className="w-px bg-gray-200 hover:bg-blue-400 active:bg-blue-500 transition-colors" />

        {/* Results (right) */}
        <Panel id="evals-results" defaultSize="30%" minSize="20%" maxSize="40%">
          <div className="h-full overflow-auto p-4">
            <AccuracyScoring results={evalResults} />
          </div>
        </Panel>
      </Group>
    </div>
  );
}
