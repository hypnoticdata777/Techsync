import {splitTooltipSections} from './HintBubble';

describe('HintBubble', () => {
  test('separates normal guidance from named key sections', () => {
    expect(
      splitTooltipSections(
        'Choose what appears in the center list. Counts show matching records. Tenant Command: Own the full operating picture. Works With: Coordinator and technician stakeholders.',
      ),
    ).toEqual([
      {
        type: 'body',
        text: 'Choose what appears in the center list. Counts show matching records.',
      },
      {
        type: 'callout',
        label: 'Tenant Command:',
        text: 'Own the full operating picture.',
      },
      {
        type: 'callout',
        label: 'Works With:',
        text: 'Coordinator and technician stakeholders.',
      },
    ]);
  });
});
