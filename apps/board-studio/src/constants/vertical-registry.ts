// ============================================================
// Vertical Registry — maps vertical slugs to UI configuration
// ============================================================

import {
  Cog,
  FlaskConical,
  Code2,
  Calculator,
  // Engineering intent icons
  Box,
  Wind,
  Wrench,
  CircuitBoard,
  Zap,
  // Science intent icons
  TestTube,
  Grid3x3,
  BarChart3,
  // Technology intent icons
  Brain,
  Shield,
  GitBranch,
  ScanLine,
  // Mathematics intent icons
  Sigma,
  TrendingUp,
  Activity,
  Target,
  // Action icons
  Play,
  RotateCcw,
  Download,
  Eye,
  FileCheck,
} from 'lucide-react';
import type { VerticalRegistry } from '@/types/vertical-registry';

export const VERTICAL_REGISTRY: VerticalRegistry = {
  // ──────────────────────────────────────────────
  // Engineering
  // ──────────────────────────────────────────────
  engineering: {
    theme: {
      slug: 'engineering',
      name: 'Engineering',
      accentColor: 'blue-600',
      accentBg: 'blue-50',
      accentText: 'blue-700',
      accentBorder: 'blue-200',
      icon: Cog,
      cardFacePreset: {
        summaryLayout: 'primary-gauge',
        primaryMetricKey: 'factor_of_safety',
        accentBarStyle: 'gradient',
        iconSize: 'lg',
      },
    },
    intentConfigs: {
      'sim.fea': {
        intentTypeSlug: 'sim.fea',
        displayName: 'FEA Simulation',
        icon: Box,
        summaryFields: [
          { key: 'config.solver', label: 'Solver', format: 'text' },
          { key: 'config.mesh_size', label: 'Mesh', format: 'number', unit: 'mm' },
          { key: 'kpis.von_mises_max', label: 'Von Mises', format: 'number', unit: 'MPa' },
        ],
        detailFields: [
          { key: 'config.solver', label: 'Solver', format: 'text' },
          { key: 'config.mesh_size', label: 'Mesh Size', format: 'number', unit: 'mm' },
          { key: 'config.element_type', label: 'Element Type', format: 'text' },
          { key: 'config.material', label: 'Material', format: 'text' },
          { key: 'config.load_case', label: 'Load Case', format: 'text' },
          { key: 'kpis.von_mises_max', label: 'Max Von Mises', format: 'number', unit: 'MPa' },
          { key: 'kpis.displacement_max', label: 'Max Displacement', format: 'number', unit: 'mm' },
          { key: 'kpis.safety_factor', label: 'Safety Factor', format: 'number' },
        ],
        actions: [
          { id: 'run', label: 'Run Analysis', icon: Play, variant: 'primary' },
          { id: 'rerun', label: 'Re-run', icon: RotateCcw, variant: 'outline', condition: (c) => c.status === 'completed' || c.status === 'failed' },
          { id: 'export', label: 'Export Results', icon: Download, variant: 'ghost', condition: (c) => c.status === 'completed' },
        ],
        executionHints: {
          recommendedTools: ['ansys-mechanical', 'abaqus', 'calculix'],
          typicalCost: { min: 50, max: 500, unit: 'USD' },
          typicalDuration: { min: '30m', max: '8h' },
          preflightRules: ['mesh-quality', 'material-defined', 'boundary-conditions'],
          requiredNodeRoles: ['validate_input', 'preprocess', 'solve', 'postprocess', 'evidence'],
        },
        evidenceSchema: {
          expectedMetrics: [
            { key: 'factor_of_safety', label: 'Factor of Safety', unit: '', typical_range: { min: 1.0, max: 4.0 }, visualization: 'gauge' },
            { key: 'stress_max', label: 'Max Stress', unit: 'MPa', typical_range: { min: 0, max: 500 }, visualization: 'bar' },
            { key: 'displacement_max', label: 'Max Displacement', unit: 'mm', typical_range: { min: 0, max: 10 }, visualization: 'value' },
          ],
          comparisonMode: 'absolute',
        },
        typicalGates: [
          { name: 'Structural Safety', type: 'evidence', auto_evaluate: true },
          { name: 'Design Review', type: 'review', auto_evaluate: false },
        ],
      },
      'sim.cfd': {
        intentTypeSlug: 'sim.cfd',
        displayName: 'CFD Analysis',
        icon: Wind,
        summaryFields: [
          { key: 'config.solver', label: 'Solver', format: 'text' },
          { key: 'config.turbulence_model', label: 'Turbulence', format: 'text' },
          { key: 'kpis.drag_coefficient', label: 'Cd', format: 'number' },
        ],
        detailFields: [
          { key: 'config.solver', label: 'Solver', format: 'text' },
          { key: 'config.turbulence_model', label: 'Turbulence Model', format: 'text' },
          { key: 'config.mesh_count', label: 'Mesh Elements', format: 'number' },
          { key: 'config.velocity', label: 'Inlet Velocity', format: 'number', unit: 'm/s' },
          { key: 'kpis.drag_coefficient', label: 'Drag Coefficient', format: 'number' },
          { key: 'kpis.lift_coefficient', label: 'Lift Coefficient', format: 'number' },
          { key: 'kpis.pressure_drop', label: 'Pressure Drop', format: 'number', unit: 'Pa' },
        ],
        actions: [
          { id: 'run', label: 'Run Simulation', icon: Play, variant: 'primary' },
          { id: 'rerun', label: 'Re-run', icon: RotateCcw, variant: 'outline', condition: (c) => c.status === 'completed' || c.status === 'failed' },
        ],
        executionHints: {
          recommendedTools: ['ansys-fluent', 'openfoam', 'star-ccm'],
          typicalCost: { min: 80, max: 800, unit: 'USD' },
          typicalDuration: { min: '1h', max: '12h' },
          preflightRules: ['mesh-quality', 'turbulence-model', 'boundary-conditions'],
          requiredNodeRoles: ['validate_input', 'preprocess', 'solve', 'postprocess', 'evidence'],
        },
        evidenceSchema: {
          expectedMetrics: [
            { key: 'pressure_drop', label: 'Pressure Drop', unit: 'Pa', typical_range: { min: 0, max: 10000 }, visualization: 'bar' },
            { key: 'velocity_max', label: 'Max Velocity', unit: 'm/s', typical_range: { min: 0, max: 100 }, visualization: 'value' },
            { key: 'convergence', label: 'Convergence', unit: '', typical_range: { min: 0, max: 1 }, visualization: 'sparkline' },
          ],
          comparisonMode: 'absolute',
        },
        typicalGates: [
          { name: 'Flow Validation', type: 'evidence', auto_evaluate: true },
          { name: 'Thermal Review', type: 'review', auto_evaluate: false },
        ],
      },
      'check.dfm': {
        intentTypeSlug: 'check.dfm',
        displayName: 'DFM Check',
        icon: Wrench,
        summaryFields: [
          { key: 'config.process', label: 'Process', format: 'text' },
          { key: 'kpis.issues_count', label: 'Issues', format: 'number' },
          { key: 'kpis.pass_rate', label: 'Pass Rate', format: 'percentage' },
        ],
        detailFields: [
          { key: 'config.process', label: 'Manufacturing Process', format: 'text' },
          { key: 'config.material', label: 'Material', format: 'text' },
          { key: 'config.tolerance_class', label: 'Tolerance Class', format: 'text' },
          { key: 'kpis.issues_count', label: 'Total Issues', format: 'number' },
          { key: 'kpis.pass_rate', label: 'Pass Rate', format: 'percentage' },
        ],
        actions: [
          { id: 'run', label: 'Run DFM Check', icon: Play, variant: 'primary' },
          { id: 'review', label: 'Review Issues', icon: Eye, variant: 'secondary', condition: (c) => c.status === 'completed' },
        ],
        executionHints: {
          recommendedTools: ['dfm-checker', 'moldflow'],
          typicalCost: { min: 20, max: 100, unit: 'USD' },
          typicalDuration: { min: '15m', max: '1h' },
          preflightRules: ['cad-model-valid', 'material-defined', 'process-selected'],
          requiredNodeRoles: ['validate_input', 'solve', 'report'],
        },
        evidenceSchema: {
          expectedMetrics: [
            { key: 'wall_thickness_min', label: 'Min Wall Thickness', unit: 'mm', typical_range: { min: 0.5, max: 10 }, visualization: 'gauge' },
            { key: 'draft_angle', label: 'Draft Angle', unit: '°', typical_range: { min: 0, max: 10 }, visualization: 'value' },
            { key: 'toolability_score', label: 'Toolability Score', unit: '%', typical_range: { min: 0, max: 100 }, visualization: 'gauge' },
          ],
          comparisonMode: 'absolute',
        },
        typicalGates: [
          { name: 'Manufacturing Review', type: 'compliance', auto_evaluate: true },
        ],
      },
      'check.pcb_drc': {
        intentTypeSlug: 'check.pcb_drc',
        displayName: 'PCB DRC',
        icon: CircuitBoard,
        summaryFields: [
          { key: 'config.standard', label: 'Standard', format: 'text' },
          { key: 'kpis.violations', label: 'Violations', format: 'number' },
        ],
        detailFields: [
          { key: 'config.standard', label: 'Design Standard', format: 'text' },
          { key: 'config.layer_count', label: 'Layer Count', format: 'number' },
          { key: 'kpis.violations', label: 'Violations', format: 'number' },
          { key: 'kpis.warnings', label: 'Warnings', format: 'number' },
        ],
        actions: [
          { id: 'run', label: 'Run DRC', icon: Play, variant: 'primary' },
          { id: 'report', label: 'View Report', icon: FileCheck, variant: 'secondary', condition: (c) => c.status === 'completed' },
        ],
        executionHints: {
          recommendedTools: ['altium-drc', 'kicad-drc'],
          typicalCost: { min: 10, max: 50, unit: 'USD' },
          typicalDuration: { min: '5m', max: '30m' },
          preflightRules: ['pcb-design-loaded', 'design-rules-defined'],
          requiredNodeRoles: ['validate_input', 'solve', 'report'],
        },
        evidenceSchema: {
          expectedMetrics: [
            { key: 'violations_count', label: 'Violations', unit: '', typical_range: { min: 0, max: 50 }, visualization: 'value' },
            { key: 'clearance_min', label: 'Min Clearance', unit: 'mil', typical_range: { min: 3, max: 20 }, visualization: 'bar' },
            { key: 'trace_width_min', label: 'Min Trace Width', unit: 'mil', typical_range: { min: 3, max: 12 }, visualization: 'value' },
          ],
          comparisonMode: 'absolute',
        },
        typicalGates: [
          { name: 'DRC Compliance', type: 'compliance', auto_evaluate: true },
        ],
      },
      'check.emc': {
        intentTypeSlug: 'check.emc',
        displayName: 'EMC Compliance',
        icon: Zap,
        summaryFields: [
          { key: 'config.standard', label: 'Standard', format: 'text' },
          { key: 'kpis.margin_db', label: 'Margin', format: 'number', unit: 'dB' },
        ],
        detailFields: [
          { key: 'config.standard', label: 'EMC Standard', format: 'text' },
          { key: 'config.frequency_range', label: 'Frequency Range', format: 'text' },
          { key: 'kpis.margin_db', label: 'Margin', format: 'number', unit: 'dB' },
          { key: 'kpis.pass', label: 'Compliance', format: 'boolean' },
        ],
        actions: [
          { id: 'run', label: 'Run EMC Check', icon: Play, variant: 'primary' },
        ],
        executionHints: {
          recommendedTools: ['emc-analyzer', 'si-analyzer'],
          typicalCost: { min: 30, max: 200, unit: 'USD' },
          typicalDuration: { min: '30m', max: '3h' },
          preflightRules: ['pcb-design-loaded', 'emc-standard-selected'],
          requiredNodeRoles: ['validate_input', 'solve', 'report', 'evidence'],
        },
        evidenceSchema: {
          expectedMetrics: [
            { key: 'emissions_margin_db', label: 'Emissions Margin', unit: 'dB', typical_range: { min: -10, max: 20 }, visualization: 'gauge' },
            { key: 'susceptibility_pass', label: 'Susceptibility', unit: '', typical_range: { min: 0, max: 1 }, visualization: 'value' },
          ],
          comparisonMode: 'absolute',
        },
        typicalGates: [
          { name: 'EMC Compliance', type: 'compliance', auto_evaluate: true },
        ],
      },
    },
  },

  // ──────────────────────────────────────────────
  // Science
  // ──────────────────────────────────────────────
  science: {
    theme: {
      slug: 'science',
      name: 'Science',
      accentColor: 'emerald-600',
      accentBg: 'emerald-50',
      accentText: 'emerald-700',
      accentBorder: 'emerald-200',
      icon: FlaskConical,
      cardFacePreset: {
        summaryLayout: 'sparkline-row',
        primaryMetricKey: 'convergence_metric',
        accentBarStyle: 'solid',
        iconSize: 'md',
      },
    },
    intentConfigs: {
      'lab.protocol': {
        intentTypeSlug: 'lab.protocol',
        displayName: 'Lab Protocol',
        icon: TestTube,
        summaryFields: [
          { key: 'config.protocol_name', label: 'Protocol', format: 'text' },
          { key: 'config.sample_count', label: 'Samples', format: 'number' },
          { key: 'kpis.completion', label: 'Progress', format: 'percentage' },
        ],
        detailFields: [
          { key: 'config.protocol_name', label: 'Protocol Name', format: 'text' },
          { key: 'config.sample_count', label: 'Sample Count', format: 'number' },
          { key: 'config.reagents', label: 'Reagents', format: 'text' },
          { key: 'config.temperature', label: 'Temperature', format: 'number', unit: 'C' },
          { key: 'kpis.completion', label: 'Completion', format: 'percentage' },
          { key: 'kpis.yield', label: 'Yield', format: 'percentage' },
        ],
        actions: [
          { id: 'run', label: 'Execute Protocol', icon: Play, variant: 'primary' },
          { id: 'review', label: 'Review Results', icon: Eye, variant: 'secondary', condition: (c) => c.status === 'completed' },
        ],
        executionHints: {
          recommendedTools: ['protocol-executor', 'opentrons'],
          typicalCost: { min: 10, max: 100, unit: 'USD' },
          typicalDuration: { min: '1h', max: '48h' },
          preflightRules: ['protocol-defined', 'reagents-available', 'equipment-calibrated'],
          requiredNodeRoles: ['validate_input', 'preprocess', 'solve', 'evidence'],
        },
        evidenceSchema: {
          expectedMetrics: [
            { key: 'yield_percent', label: 'Yield', unit: '%', typical_range: { min: 0, max: 100 }, visualization: 'gauge' },
            { key: 'purity', label: 'Purity', unit: '%', typical_range: { min: 90, max: 100 }, visualization: 'bar' },
            { key: 'sample_count', label: 'Samples', unit: '', typical_range: { min: 1, max: 100 }, visualization: 'value' },
          ],
          comparisonMode: 'absolute',
        },
        typicalGates: [
          { name: 'Ethics Review', type: 'review', auto_evaluate: false },
          { name: 'Reproducibility Check', type: 'evidence', auto_evaluate: true },
        ],
      },
      'analysis.mesh_convergence': {
        intentTypeSlug: 'analysis.mesh_convergence',
        displayName: 'Mesh Convergence',
        icon: Grid3x3,
        summaryFields: [
          { key: 'config.refinement_levels', label: 'Levels', format: 'number' },
          { key: 'kpis.convergence_rate', label: 'Rate', format: 'number' },
          { key: 'kpis.converged', label: 'Converged', format: 'boolean' },
        ],
        detailFields: [
          { key: 'config.refinement_levels', label: 'Refinement Levels', format: 'number' },
          { key: 'config.target_error', label: 'Target Error', format: 'percentage' },
          { key: 'kpis.convergence_rate', label: 'Convergence Rate', format: 'number' },
          { key: 'kpis.final_error', label: 'Final Error', format: 'percentage' },
          { key: 'kpis.converged', label: 'Converged', format: 'boolean' },
        ],
        actions: [
          { id: 'run', label: 'Run Study', icon: Play, variant: 'primary' },
        ],
        executionHints: {
          recommendedTools: ['convergence-analyzer'],
          typicalCost: { min: 50, max: 300, unit: 'USD' },
          typicalDuration: { min: '1h', max: '6h' },
          preflightRules: ['base-mesh-defined', 'refinement-levels-set'],
          requiredNodeRoles: ['validate_input', 'solve', 'postprocess', 'evidence'],
        },
        evidenceSchema: {
          expectedMetrics: [
            { key: 'gci_index', label: 'GCI Index', unit: '', typical_range: { min: 0, max: 0.1 }, visualization: 'gauge' },
            { key: 'error_bound', label: 'Error Bound', unit: '%', typical_range: { min: 0, max: 10 }, visualization: 'bar' },
            { key: 'extrapolated_value', label: 'Extrapolated Value', unit: '', typical_range: { min: 0, max: 1000 }, visualization: 'value' },
          ],
          comparisonMode: 'ratio',
        },
        typicalGates: [
          { name: 'Verification Review', type: 'evidence', auto_evaluate: true },
        ],
      },
      'analysis.uq': {
        intentTypeSlug: 'analysis.uq',
        displayName: 'Uncertainty Quantification',
        icon: BarChart3,
        summaryFields: [
          { key: 'config.method', label: 'Method', format: 'text' },
          { key: 'kpis.confidence_interval', label: 'CI', format: 'percentage' },
        ],
        detailFields: [
          { key: 'config.method', label: 'UQ Method', format: 'text' },
          { key: 'config.num_samples', label: 'Samples', format: 'number' },
          { key: 'config.distribution', label: 'Distribution', format: 'text' },
          { key: 'kpis.mean', label: 'Mean', format: 'number' },
          { key: 'kpis.std_dev', label: 'Std Dev', format: 'number' },
          { key: 'kpis.confidence_interval', label: 'Confidence Interval', format: 'percentage' },
        ],
        actions: [
          { id: 'run', label: 'Run UQ Analysis', icon: Play, variant: 'primary' },
        ],
        executionHints: {
          recommendedTools: ['uq-engine', 'dakota'],
          typicalCost: { min: 100, max: 1000, unit: 'USD' },
          typicalDuration: { min: '2h', max: '24h' },
          preflightRules: ['input-distributions-defined', 'sample-count-set'],
          requiredNodeRoles: ['validate_input', 'preprocess', 'solve', 'postprocess', 'evidence'],
        },
        evidenceSchema: {
          expectedMetrics: [
            { key: 'confidence_interval_width', label: 'CI Width', unit: '', typical_range: { min: 0, max: 1 }, visualization: 'bar' },
            { key: 'sensitivity_indices', label: 'Sensitivity', unit: '', typical_range: { min: 0, max: 1 }, visualization: 'sparkline' },
            { key: 'p_value', label: 'p-value', unit: '', typical_range: { min: 0, max: 1 }, visualization: 'gauge' },
          ],
          comparisonMode: 'delta',
        },
        typicalGates: [
          { name: 'Statistical Review', type: 'evidence', auto_evaluate: true },
          { name: 'Methodology Review', type: 'review', auto_evaluate: false },
        ],
      },
    },
  },

  // ──────────────────────────────────────────────
  // Technology
  // ──────────────────────────────────────────────
  technology: {
    theme: {
      slug: 'technology',
      name: 'Technology',
      accentColor: 'violet-600',
      accentBg: 'violet-50',
      accentText: 'violet-700',
      accentBorder: 'violet-200',
      icon: Code2,
      cardFacePreset: {
        summaryLayout: 'metrics-row',
        primaryMetricKey: 'accuracy',
        accentBarStyle: 'split',
        iconSize: 'sm',
      },
    },
    intentConfigs: {
      'ml.training': {
        intentTypeSlug: 'ml.training',
        displayName: 'ML Training',
        icon: Brain,
        summaryFields: [
          { key: 'config.model_type', label: 'Model', format: 'text' },
          { key: 'config.epochs', label: 'Epochs', format: 'number' },
          { key: 'kpis.accuracy', label: 'Accuracy', format: 'percentage' },
        ],
        detailFields: [
          { key: 'config.model_type', label: 'Model Type', format: 'text' },
          { key: 'config.epochs', label: 'Epochs', format: 'number' },
          { key: 'config.learning_rate', label: 'Learning Rate', format: 'number' },
          { key: 'config.batch_size', label: 'Batch Size', format: 'number' },
          { key: 'config.optimizer', label: 'Optimizer', format: 'text' },
          { key: 'kpis.accuracy', label: 'Accuracy', format: 'percentage' },
          { key: 'kpis.loss', label: 'Loss', format: 'number' },
          { key: 'kpis.f1_score', label: 'F1 Score', format: 'number' },
        ],
        actions: [
          { id: 'run', label: 'Start Training', icon: Play, variant: 'primary' },
          { id: 'rerun', label: 'Retrain', icon: RotateCcw, variant: 'outline', condition: (c) => c.status === 'completed' || c.status === 'failed' },
          { id: 'export', label: 'Export Model', icon: Download, variant: 'ghost', condition: (c) => c.status === 'completed' },
        ],
        executionHints: {
          recommendedTools: ['pytorch-trainer', 'tensorflow', 'huggingface'],
          typicalCost: { min: 20, max: 2000, unit: 'USD' },
          typicalDuration: { min: '15m', max: '48h' },
          preflightRules: ['dataset-loaded', 'model-config-valid', 'gpu-available'],
          requiredNodeRoles: ['validate_input', 'preprocess', 'solve', 'postprocess', 'evidence'],
        },
        evidenceSchema: {
          expectedMetrics: [
            { key: 'accuracy', label: 'Accuracy', unit: '%', typical_range: { min: 0, max: 100 }, visualization: 'gauge' },
            { key: 'loss', label: 'Loss', unit: '', typical_range: { min: 0, max: 5 }, visualization: 'sparkline' },
            { key: 'f1_score', label: 'F1 Score', unit: '', typical_range: { min: 0, max: 1 }, visualization: 'gauge' },
          ],
          comparisonMode: 'delta',
        },
        typicalGates: [
          { name: 'Performance Review', type: 'evidence', auto_evaluate: true },
          { name: 'Bias Review', type: 'review', auto_evaluate: false },
        ],
      },
      'review.bias': {
        intentTypeSlug: 'review.bias',
        displayName: 'Bias Review',
        icon: Shield,
        summaryFields: [
          { key: 'config.dataset', label: 'Dataset', format: 'text' },
          { key: 'kpis.bias_score', label: 'Bias Score', format: 'number' },
          { key: 'kpis.fairness_metric', label: 'Fairness', format: 'percentage' },
        ],
        detailFields: [
          { key: 'config.dataset', label: 'Dataset', format: 'text' },
          { key: 'config.protected_attributes', label: 'Protected Attrs', format: 'text' },
          { key: 'kpis.bias_score', label: 'Bias Score', format: 'number' },
          { key: 'kpis.fairness_metric', label: 'Fairness Metric', format: 'percentage' },
          { key: 'kpis.disparate_impact', label: 'Disparate Impact', format: 'number' },
        ],
        actions: [
          { id: 'run', label: 'Run Review', icon: Play, variant: 'primary' },
          { id: 'report', label: 'View Report', icon: FileCheck, variant: 'secondary', condition: (c) => c.status === 'completed' },
        ],
        executionHints: {
          recommendedTools: ['bias-scanner', 'fairlearn'],
          typicalCost: { min: 10, max: 100, unit: 'USD' },
          typicalDuration: { min: '15m', max: '2h' },
          preflightRules: ['dataset-loaded', 'protected-attributes-defined'],
          requiredNodeRoles: ['validate_input', 'solve', 'report', 'evidence'],
        },
        evidenceSchema: {
          expectedMetrics: [
            { key: 'demographic_parity', label: 'Demographic Parity', unit: '', typical_range: { min: 0, max: 1 }, visualization: 'gauge' },
            { key: 'equalized_odds', label: 'Equalized Odds', unit: '', typical_range: { min: 0, max: 1 }, visualization: 'gauge' },
            { key: 'disparate_impact', label: 'Disparate Impact', unit: '', typical_range: { min: 0.8, max: 1.25 }, visualization: 'bar' },
          ],
          comparisonMode: 'absolute',
        },
        typicalGates: [
          { name: 'Fairness Review', type: 'evidence', auto_evaluate: true },
          { name: 'Ethics Review', type: 'review', auto_evaluate: false },
        ],
      },
      'ci.pipeline': {
        intentTypeSlug: 'ci.pipeline',
        displayName: 'CI/CD Pipeline',
        icon: GitBranch,
        summaryFields: [
          { key: 'config.pipeline', label: 'Pipeline', format: 'text' },
          { key: 'kpis.pass_rate', label: 'Pass Rate', format: 'percentage' },
          { key: 'kpis.duration', label: 'Duration', format: 'duration' },
        ],
        detailFields: [
          { key: 'config.pipeline', label: 'Pipeline Name', format: 'text' },
          { key: 'config.branch', label: 'Branch', format: 'text' },
          { key: 'config.trigger', label: 'Trigger', format: 'text' },
          { key: 'kpis.pass_rate', label: 'Pass Rate', format: 'percentage' },
          { key: 'kpis.duration', label: 'Duration', format: 'duration' },
          { key: 'kpis.test_count', label: 'Tests', format: 'number' },
        ],
        actions: [
          { id: 'run', label: 'Run Pipeline', icon: Play, variant: 'primary' },
        ],
        executionHints: {
          recommendedTools: ['github-actions', 'jenkins', 'gitlab-ci'],
          typicalCost: { min: 5, max: 50, unit: 'USD' },
          typicalDuration: { min: '5m', max: '1h' },
          preflightRules: ['pipeline-config-valid', 'source-repo-accessible'],
          requiredNodeRoles: ['validate_input', 'solve', 'evidence'],
        },
        evidenceSchema: {
          expectedMetrics: [
            { key: 'test_coverage', label: 'Test Coverage', unit: '%', typical_range: { min: 0, max: 100 }, visualization: 'gauge' },
            { key: 'build_time', label: 'Build Time', unit: 's', typical_range: { min: 10, max: 600 }, visualization: 'value' },
            { key: 'vulnerabilities', label: 'Vulnerabilities', unit: '', typical_range: { min: 0, max: 20 }, visualization: 'value' },
          ],
          comparisonMode: 'delta',
        },
        typicalGates: [
          { name: 'Quality Gate', type: 'evidence', auto_evaluate: true },
          { name: 'Security Review', type: 'review', auto_evaluate: false },
        ],
      },
      'scan.security': {
        intentTypeSlug: 'scan.security',
        displayName: 'Security Scan',
        icon: ScanLine,
        summaryFields: [
          { key: 'config.scan_type', label: 'Type', format: 'text' },
          { key: 'kpis.vulnerabilities', label: 'Vulns', format: 'number' },
          { key: 'kpis.critical_count', label: 'Critical', format: 'number' },
        ],
        detailFields: [
          { key: 'config.scan_type', label: 'Scan Type', format: 'text' },
          { key: 'config.target', label: 'Target', format: 'text' },
          { key: 'kpis.vulnerabilities', label: 'Vulnerabilities', format: 'number' },
          { key: 'kpis.critical_count', label: 'Critical', format: 'number' },
          { key: 'kpis.high_count', label: 'High', format: 'number' },
          { key: 'kpis.medium_count', label: 'Medium', format: 'number' },
        ],
        actions: [
          { id: 'run', label: 'Run Scan', icon: Play, variant: 'primary' },
          { id: 'report', label: 'View Report', icon: FileCheck, variant: 'secondary', condition: (c) => c.status === 'completed' },
        ],
        executionHints: {
          recommendedTools: ['snyk', 'trivy', 'semgrep'],
          typicalCost: { min: 10, max: 100, unit: 'USD' },
          typicalDuration: { min: '10m', max: '1h' },
          preflightRules: ['target-accessible', 'scan-profile-selected'],
          requiredNodeRoles: ['validate_input', 'solve', 'report', 'evidence'],
        },
        evidenceSchema: {
          expectedMetrics: [
            { key: 'critical_vulns', label: 'Critical Vulns', unit: '', typical_range: { min: 0, max: 10 }, visualization: 'value' },
            { key: 'high_vulns', label: 'High Vulns', unit: '', typical_range: { min: 0, max: 20 }, visualization: 'value' },
            { key: 'compliance_score', label: 'Compliance Score', unit: '%', typical_range: { min: 0, max: 100 }, visualization: 'gauge' },
          ],
          comparisonMode: 'absolute',
        },
        typicalGates: [
          { name: 'Security Gate', type: 'evidence', auto_evaluate: true },
          { name: 'Compliance Review', type: 'compliance', auto_evaluate: false },
        ],
      },
    },
  },

  // ──────────────────────────────────────────────
  // Mathematics
  // ──────────────────────────────────────────────
  mathematics: {
    theme: {
      slug: 'mathematics',
      name: 'Mathematics',
      accentColor: 'amber-600',
      accentBg: 'amber-50',
      accentText: 'amber-700',
      accentBorder: 'amber-200',
      icon: Calculator,
      cardFacePreset: {
        summaryLayout: 'stats-grid',
        primaryMetricKey: 'p_value',
        accentBarStyle: 'solid',
        iconSize: 'md',
      },
    },
    intentConfigs: {
      'doe.design': {
        intentTypeSlug: 'doe.design',
        displayName: 'Design of Experiments',
        icon: Sigma,
        summaryFields: [
          { key: 'config.design_type', label: 'Design', format: 'text' },
          { key: 'config.factors', label: 'Factors', format: 'number' },
          { key: 'kpis.runs_total', label: 'Runs', format: 'number' },
        ],
        detailFields: [
          { key: 'config.design_type', label: 'Design Type', format: 'text' },
          { key: 'config.factors', label: 'Number of Factors', format: 'number' },
          { key: 'config.levels', label: 'Levels', format: 'number' },
          { key: 'config.replicates', label: 'Replicates', format: 'number' },
          { key: 'kpis.runs_total', label: 'Total Runs', format: 'number' },
          { key: 'kpis.runs_completed', label: 'Completed', format: 'number' },
        ],
        actions: [
          { id: 'run', label: 'Generate Design', icon: Play, variant: 'primary' },
          { id: 'export', label: 'Export Design', icon: Download, variant: 'ghost', condition: (c) => c.status === 'completed' },
        ],
        executionHints: {
          recommendedTools: ['jmp', 'pyDOE'],
          typicalCost: { min: 10, max: 100, unit: 'USD' },
          typicalDuration: { min: '15m', max: '2h' },
          preflightRules: ['factors-defined', 'response-defined'],
          requiredNodeRoles: ['validate_input', 'solve', 'report'],
        },
        evidenceSchema: {
          expectedMetrics: [
            { key: 'design_efficiency', label: 'Design Efficiency', unit: '%', typical_range: { min: 50, max: 100 }, visualization: 'gauge' },
            { key: 'power', label: 'Power', unit: '', typical_range: { min: 0, max: 1 }, visualization: 'gauge' },
            { key: 'factor_count', label: 'Factors', unit: '', typical_range: { min: 2, max: 20 }, visualization: 'value' },
          ],
          comparisonMode: 'absolute',
        },
        typicalGates: [
          { name: 'Methodology Review', type: 'review', auto_evaluate: false },
        ],
      },
      'opt.pareto': {
        intentTypeSlug: 'opt.pareto',
        displayName: 'Pareto Optimization',
        icon: TrendingUp,
        summaryFields: [
          { key: 'config.objectives', label: 'Objectives', format: 'number' },
          { key: 'kpis.pareto_points', label: 'Pareto Pts', format: 'number' },
          { key: 'kpis.hypervolume', label: 'HV', format: 'number' },
        ],
        detailFields: [
          { key: 'config.objectives', label: 'Objectives', format: 'number' },
          { key: 'config.algorithm', label: 'Algorithm', format: 'text' },
          { key: 'config.population_size', label: 'Population', format: 'number' },
          { key: 'config.generations', label: 'Generations', format: 'number' },
          { key: 'kpis.pareto_points', label: 'Pareto Points', format: 'number' },
          { key: 'kpis.hypervolume', label: 'Hypervolume', format: 'number' },
        ],
        actions: [
          { id: 'run', label: 'Run Optimization', icon: Play, variant: 'primary' },
        ],
        executionHints: {
          recommendedTools: ['pymoo', 'platypus'],
          typicalCost: { min: 50, max: 500, unit: 'USD' },
          typicalDuration: { min: '1h', max: '12h' },
          preflightRules: ['objectives-defined', 'constraints-defined', 'bounds-set'],
          requiredNodeRoles: ['validate_input', 'solve', 'postprocess', 'evidence'],
        },
        evidenceSchema: {
          expectedMetrics: [
            { key: 'pareto_front_size', label: 'Pareto Front Size', unit: '', typical_range: { min: 5, max: 200 }, visualization: 'value' },
            { key: 'hypervolume', label: 'Hypervolume', unit: '', typical_range: { min: 0, max: 1 }, visualization: 'bar' },
            { key: 'convergence_gen', label: 'Convergence Gen', unit: '', typical_range: { min: 10, max: 500 }, visualization: 'sparkline' },
          ],
          comparisonMode: 'delta',
        },
        typicalGates: [
          { name: 'Convergence Proof', type: 'evidence', auto_evaluate: true },
          { name: 'Design Review', type: 'review', auto_evaluate: false },
        ],
      },
      'stat.power_analysis': {
        intentTypeSlug: 'stat.power_analysis',
        displayName: 'Power Analysis',
        icon: Activity,
        summaryFields: [
          { key: 'config.test_type', label: 'Test', format: 'text' },
          { key: 'kpis.power', label: 'Power', format: 'percentage' },
          { key: 'kpis.sample_size', label: 'N Required', format: 'number' },
        ],
        detailFields: [
          { key: 'config.test_type', label: 'Test Type', format: 'text' },
          { key: 'config.effect_size', label: 'Effect Size', format: 'number' },
          { key: 'config.alpha', label: 'Alpha', format: 'number' },
          { key: 'kpis.power', label: 'Statistical Power', format: 'percentage' },
          { key: 'kpis.sample_size', label: 'Required Sample Size', format: 'number' },
        ],
        actions: [
          { id: 'run', label: 'Calculate', icon: Play, variant: 'primary' },
        ],
        executionHints: {
          recommendedTools: ['statsmodels', 'g-power'],
          typicalCost: { min: 5, max: 50, unit: 'USD' },
          typicalDuration: { min: '5m', max: '30m' },
          preflightRules: ['test-type-selected', 'effect-size-defined'],
          requiredNodeRoles: ['validate_input', 'solve', 'evidence'],
        },
        evidenceSchema: {
          expectedMetrics: [
            { key: 'power', label: 'Statistical Power', unit: '', typical_range: { min: 0, max: 1 }, visualization: 'gauge' },
            { key: 'effect_size', label: 'Effect Size', unit: '', typical_range: { min: 0, max: 2 }, visualization: 'bar' },
            { key: 'sample_size_required', label: 'Sample Size', unit: '', typical_range: { min: 10, max: 10000 }, visualization: 'value' },
          ],
          comparisonMode: 'absolute',
        },
        typicalGates: [
          { name: 'Statistical Review', type: 'evidence', auto_evaluate: true },
        ],
      },
      'stat.hypothesis_test': {
        intentTypeSlug: 'stat.hypothesis_test',
        displayName: 'Hypothesis Test',
        icon: Target,
        summaryFields: [
          { key: 'config.test_type', label: 'Test', format: 'text' },
          { key: 'kpis.p_value', label: 'p-value', format: 'number' },
          { key: 'kpis.significant', label: 'Significant', format: 'boolean' },
        ],
        detailFields: [
          { key: 'config.test_type', label: 'Test Type', format: 'text' },
          { key: 'config.alpha', label: 'Significance Level', format: 'number' },
          { key: 'config.hypothesis', label: 'Hypothesis', format: 'text' },
          { key: 'kpis.test_statistic', label: 'Test Statistic', format: 'number' },
          { key: 'kpis.p_value', label: 'p-value', format: 'number' },
          { key: 'kpis.significant', label: 'Significant', format: 'boolean' },
          { key: 'kpis.confidence_interval', label: 'Confidence Interval', format: 'text' },
        ],
        actions: [
          { id: 'run', label: 'Run Test', icon: Play, variant: 'primary' },
        ],
        executionHints: {
          recommendedTools: ['scipy', 'r-stats'],
          typicalCost: { min: 5, max: 50, unit: 'USD' },
          typicalDuration: { min: '5m', max: '30m' },
          preflightRules: ['data-loaded', 'hypothesis-defined', 'alpha-set'],
          requiredNodeRoles: ['validate_input', 'solve', 'evidence'],
        },
        evidenceSchema: {
          expectedMetrics: [
            { key: 'p_value', label: 'p-value', unit: '', typical_range: { min: 0, max: 1 }, visualization: 'gauge' },
            { key: 'effect_size', label: 'Effect Size', unit: '', typical_range: { min: 0, max: 2 }, visualization: 'bar' },
            { key: 'confidence_interval', label: 'Confidence Interval', unit: '', typical_range: { min: 0, max: 100 }, visualization: 'value' },
          ],
          comparisonMode: 'absolute',
        },
        typicalGates: [
          { name: 'Methodology Review', type: 'evidence', auto_evaluate: true },
          { name: 'Peer Review', type: 'review', auto_evaluate: false },
        ],
      },
    },
  },
};

/** All known vertical slugs */
export const VERTICAL_SLUGS = Object.keys(VERTICAL_REGISTRY);

/** Map from common board type prefixes to vertical slugs */
export const BOARD_TYPE_TO_VERTICAL: Record<string, string> = {
  'engineering': 'engineering',
  'mechanical': 'engineering',
  'electrical': 'engineering',
  'science': 'science',
  'lab': 'science',
  'research': 'science',
  'technology': 'technology',
  'mlops': 'technology',
  'software': 'technology',
  'math': 'mathematics',
  'mathematics': 'mathematics',
  'optimization': 'mathematics',
  'statistics': 'mathematics',
};
