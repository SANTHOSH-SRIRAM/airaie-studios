import React from 'react';
import PolicyOverview from '@components/policy/PolicyOverview';
import GuardrailTestRunner from '@components/policy/GuardrailTestRunner';

export default function PolicyPage() {
  return (
    <div className="p-6 space-y-6">
      <PolicyOverview />
      <GuardrailTestRunner />
    </div>
  );
}
