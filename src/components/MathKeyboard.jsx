import React, { useState } from 'react';

// Symbol groups shown in the math keyboard panel
const SYMBOL_GROUPS = [
  {
    label: 'Common',
    symbols: [
      { display: 'x²',   insert: '^{2}',           tip: 'Square' },
      { display: 'xⁿ',   insert: '^{}',             tip: 'Power' },
      { display: 'x₁',   insert: '_{}',             tip: 'Subscript' },
      { display: '√x',   insert: '\\sqrt{}',        tip: 'Square root' },
      { display: '∛x',   insert: '\\sqrt[3]{}',     tip: 'Cube root' },
      { display: 'a/b',  insert: '\\frac{}{}',      tip: 'Fraction' },
      { display: '|x|',  insert: '|{}|',            tip: 'Absolute value' },
      { display: '±',    insert: '\\pm ',           tip: 'Plus-minus' },
      { display: '×',    insert: '\\times ',        tip: 'Multiply' },
      { display: '÷',    insert: '\\div ',          tip: 'Divide' },
      { display: '≠',    insert: '\\neq ',          tip: 'Not equal' },
      { display: '≈',    insert: '\\approx ',       tip: 'Approx' },
      { display: '≤',    insert: '\\leq ',          tip: 'Less or equal' },
      { display: '≥',    insert: '\\geq ',          tip: 'Greater or equal' },
      { display: '∞',    insert: '\\infty ',        tip: 'Infinity' },
      { display: '∝',    insert: '\\propto ',       tip: 'Proportional' },
    ],
  },
  {
    label: 'Greek',
    symbols: [
      { display: 'α', insert: '\\alpha ',   tip: 'alpha' },
      { display: 'β', insert: '\\beta ',    tip: 'beta' },
      { display: 'γ', insert: '\\gamma ',   tip: 'gamma' },
      { display: 'Γ', insert: '\\Gamma ',   tip: 'Gamma' },
      { display: 'δ', insert: '\\delta ',   tip: 'delta' },
      { display: 'Δ', insert: '\\Delta ',   tip: 'Delta' },
      { display: 'ε', insert: '\\epsilon ', tip: 'epsilon' },
      { display: 'θ', insert: '\\theta ',   tip: 'theta' },
      { display: 'Θ', insert: '\\Theta ',   tip: 'Theta' },
      { display: 'λ', insert: '\\lambda ',  tip: 'lambda' },
      { display: 'μ', insert: '\\mu ',      tip: 'mu' },
      { display: 'π', insert: '\\pi ',      tip: 'pi' },
      { display: 'Π', insert: '\\Pi ',      tip: 'Pi' },
      { display: 'ρ', insert: '\\rho ',     tip: 'rho' },
      { display: 'σ', insert: '\\sigma ',   tip: 'sigma' },
      { display: 'Σ', insert: '\\Sigma ',   tip: 'Sigma (sum)' },
      { display: 'τ', insert: '\\tau ',     tip: 'tau' },
      { display: 'φ', insert: '\\phi ',     tip: 'phi' },
      { display: 'ω', insert: '\\omega ',   tip: 'omega' },
      { display: 'Ω', insert: '\\Omega ',   tip: 'Omega' },
    ],
  },
  {
    label: 'Calculus',
    symbols: [
      { display: 'd/dx',    insert: '\\frac{d}{dx}',              tip: 'Derivative' },
      { display: 'd²/dx²',  insert: '\\frac{d^2}{dx^2}',         tip: '2nd derivative' },
      { display: '∂/∂x',   insert: '\\frac{\\partial}{\\partial x}', tip: 'Partial derivative' },
      { display: '∫',       insert: '\\int ',                     tip: 'Integral' },
      { display: '∫ₐᵇ',    insert: '\\int_{a}^{b} ',             tip: 'Definite integral' },
      { display: '∮',       insert: '\\oint ',                    tip: 'Contour integral' },
      { display: 'lim',     insert: '\\lim_{x \\to }',           tip: 'Limit' },
      { display: 'Σ',       insert: '\\sum_{i=1}^{n} ',          tip: 'Summation' },
      { display: '∏',       insert: '\\prod_{i=1}^{n} ',         tip: 'Product' },
      { display: '∇',       insert: '\\nabla ',                   tip: 'Nabla / gradient' },
    ],
  },
  {
    label: 'Physics',
    symbols: [
      { display: 'F⃗',   insert: '\\vec{F}',      tip: 'Vector F' },
      { display: 'v⃗',   insert: '\\vec{v}',      tip: 'Vector v' },
      { display: 'â',    insert: '\\hat{a}',      tip: 'Unit vector' },
      { display: 'ℏ',    insert: '\\hbar ',       tip: 'h-bar (Planck)' },
      { display: 'c²',   insert: 'c^{2}',         tip: 'c squared' },
      { display: 'eV',   insert: '\\text{eV}',    tip: 'Electron volt' },
      { display: 'Å',    insert: '\\text{Å}',     tip: 'Angstrom' },
      { display: '°C',   insert: '^{\\circ}\\text{C}', tip: 'Celsius' },
      { display: '°',    insert: '^{\\circ}',     tip: 'Degree' },
      { display: 'kg',   insert: '\\text{kg}',    tip: 'Kilogram' },
      { display: 'm/s',  insert: '\\text{m/s}',   tip: 'Metres per second' },
      { display: 'm/s²', insert: '\\text{m/s}^2', tip: 'm/s²' },
    ],
  },
  {
    label: 'Sets / Logic',
    symbols: [
      { display: '∈',  insert: '\\in ',        tip: 'Element of' },
      { display: '∉',  insert: '\\notin ',     tip: 'Not element of' },
      { display: '⊂',  insert: '\\subset ',    tip: 'Subset' },
      { display: '⊆',  insert: '\\subseteq ',  tip: 'Subset or equal' },
      { display: '∪',  insert: '\\cup ',       tip: 'Union' },
      { display: '∩',  insert: '\\cap ',       tip: 'Intersection' },
      { display: '∅',  insert: '\\emptyset ',  tip: 'Empty set' },
      { display: '∀',  insert: '\\forall ',    tip: 'For all' },
      { display: '∃',  insert: '\\exists ',    tip: 'There exists' },
      { display: '¬',  insert: '\\neg ',       tip: 'Negation' },
      { display: '∧',  insert: '\\land ',      tip: 'And' },
      { display: '∨',  insert: '\\lor ',       tip: 'Or' },
      { display: '⇒',  insert: '\\Rightarrow ', tip: 'Implies' },
      { display: '⟺',  insert: '\\Leftrightarrow ', tip: 'Iff' },
    ],
  },
];

const MathKeyboard = ({ onInsert, onClose }) => {
  const [activeGroup, setActiveGroup] = useState(0);

  return (
    <div className="math-keyboard">
      {/* Tab bar */}
      <div className="math-keyboard-tabs">
        {SYMBOL_GROUPS.map((g, i) => (
          <button
            key={g.label}
            className={`math-kb-tab ${activeGroup === i ? 'active' : ''}`}
            onClick={() => setActiveGroup(i)}
            type="button"
          >
            {g.label}
          </button>
        ))}
        <button
          className="math-kb-close"
          onClick={onClose}
          type="button"
          title="Close keyboard"
        >
          ✕
        </button>
      </div>

      {/* Symbol grid */}
      <div className="math-keyboard-grid">
        {SYMBOL_GROUPS[activeGroup].symbols.map((sym) => (
          <button
            key={sym.insert}
            className="math-sym-btn"
            onClick={() => onInsert(sym.insert)}
            type="button"
            title={sym.tip}
          >
            {sym.display}
          </button>
        ))}
      </div>

      {/* Wrap-in-$ hint */}
      <div className="math-keyboard-hint">
        Tip: symbols are inserted as LaTeX. Wrap inline math with <code>$...$</code> or display math with <code>$$...$$</code>
      </div>
    </div>
  );
};

export default MathKeyboard;
