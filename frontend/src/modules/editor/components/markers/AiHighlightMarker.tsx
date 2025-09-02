import { createReactStyleSpec } from '@blocknote/react';

export const AIHighlight = createReactStyleSpec(
  {
    type: 'aiHighlight',
    propSchema: 'string',
  },
  {
    render: (props) => (
      <span
        style={{
          backgroundColor:
            props.value === 'processing'
              ? 'rgba(251, 191, 36, 0.15)'
              : 'rgba(59, 130, 246, 0.15)',
          border:
            props.value === 'processing'
              ? '1px solid rgba(251, 191, 36, 0.3)'
              : '1px solid rgba(59, 130, 246, 0.3)',
          borderRadius: '3px',
          padding: '1px 2px',
          transition: 'all 0.2s ease',
          animation:
            props.value === 'processing' ? 'pulse 2s infinite' : 'none',
        }}
        ref={props.contentRef}
      />
    ),
  }
);
