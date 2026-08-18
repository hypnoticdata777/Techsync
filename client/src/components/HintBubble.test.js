import {splitTooltipItems, splitTooltipSections} from './HintBubble';

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

  test('splits section copy into scannable tooltip rows', () => {
    expect(
      splitTooltipItems(
        'All Work = every request in the tenant | Risk = requests that need attention | Active = work still moving',
      ),
    ).toEqual([
      {label: 'All Work', text: 'every request in the tenant'},
      {label: 'Risk', text: 'requests that need attention'},
      {label: 'Active', text: 'work still moving'},
    ]);
  });

  test('splits unlabeled option lists into simple rows', () => {
    expect(splitTooltipItems('request ID | address | client')).toEqual([
      {label: null, text: 'request ID'},
      {label: null, text: 'address'},
      {label: null, text: 'client'},
    ]);
  });
});
