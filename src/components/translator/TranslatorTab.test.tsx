import * as React from 'react';
import { render } from 'test/utils';
import { TranslatorTab, TranslatorTabProps } from './TranslatorTab';
import {
  Spanish,
  createRenderNode,
  createSendMsgAction,
  createExit,
  createMatchRouter,
  createSendEmailAction
} from 'testUtils/assetCreators';
import { RenderNodeMap } from 'store/flowContext';
import { createUUID } from 'utils';
import { Category } from 'flowTypes';
import { getSwitchRouter } from 'components/flow/routers/helpers';
import { setupStore } from 'testUtils';

const translatorProps: TranslatorTabProps = {
  localization: {},
  nodes: {},
  popped: null,

  // callbacks
  onToggled: jest.fn(),
  onTranslationClicked: jest.fn(),
  onTranslationOpened: jest.fn(),
  onTranslationFilterChanged: jest.fn(),
  onUpdateLocalizations: jest.fn(),

  translationFilters: {
    categories: true
  }
};

const createMessageNode = (
  message: string,
  quick_replies: string[] = [],
  variables: string[] = [],
  translation?: string
): { nodes: RenderNodeMap; localization: { [uuid: string]: any } } => {
  const nodes: RenderNodeMap = {};
  const localization: { [uuid: string]: any } = {};

  const sendMsg = createSendMsgAction({ text: message });
  sendMsg.quick_replies = quick_replies;

  if (variables.length > 0) {
    // todo: is templating still a thing here?
    (sendMsg as any).templating = {
      template: { uuid: createUUID(), name: 'My Template' },
      components: [
        {
          uuid: createUUID(),
          name: 'body',
          params: variables
        }
      ]
    };
  }

  const renderNode = createRenderNode({
    actions: [sendMsg],
    exits: [createExit()]
  });

  nodes[renderNode.node.uuid] = renderNode;

  if (localization && translation) {
    localization[renderNode.node.actions[0].uuid] = { text: [translation] };
  }

  return { nodes, localization };
};

const createRouterNode = (
  categories: string[],
  translations?: string[]
): { nodes: RenderNodeMap; localization: { [uuid: string]: any } } => {
  const nodes: RenderNodeMap = {};
  const localization: { [uuid: string]: any } = {};

  const renderNode = createMatchRouter(categories);
  nodes[renderNode.node.uuid] = renderNode;

  if (localization && translations) {
    const router = getSwitchRouter(renderNode.node);
    router.categories.forEach((category: Category, idx: number) => {
      localization[category.uuid] = { name: [translations[idx]] };
    });
  }

  return { nodes, localization };
};

describe(TranslatorTab.name, () => {
  beforeEach(() => {
    setupStore({ languageCode: 'spa', isTranslating: true });
  });

  it('renders', () => {
    const { baseElement, getByText } = render(<TranslatorTab {...translatorProps} />);
    getByText('Spanish');
    expect(baseElement).toMatchSnapshot();
  });

  it('finds message translations', () => {
    const { baseElement, getByText, rerender } = render(<TranslatorTab {...translatorProps} />);

    const updates = createMessageNode('Hello World!', ['yes', 'no']);
    rerender(<TranslatorTab {...translatorProps} {...updates} />);

    // we pulled out all the localizable bits
    getByText('Hello World!');

    getByText('0%');
    expect(baseElement).toMatchSnapshot();
  });

  it('finds email translations', () => {
    const { baseElement, getByText, rerender } = render(<TranslatorTab {...translatorProps} />);

    const renderNode = createRenderNode({
      actions: [createSendEmailAction({ subject: 'Urgent!', body: 'I need this yesterday' })],
      exits: [createExit()]
    });

    rerender(<TranslatorTab {...translatorProps} nodes={{ [renderNode.node.uuid]: renderNode }} />);

    // we pulled out all the localizable bits
    getByText('Subject');
    getByText('Body');

    getByText('0%');
    expect(baseElement).toMatchSnapshot();
  });

  it('finds split translations', () => {
    const { baseElement, getByText, rerender, queryByText } = render(
      <TranslatorTab {...translatorProps} />
    );

    let updates = createRouterNode(['Red', 'Green', 'Blue']);
    rerender(<TranslatorTab {...translatorProps} {...updates} />);

    // category list
    getByText('Red, Green, Blue, Other');

    expect(baseElement).toMatchSnapshot();
  });

  it('handles partial category translation', () => {
    const { baseElement, getByText, rerender, queryByText } = render(
      <TranslatorTab {...translatorProps} />
    );

    // partial translation
    const updates = createRouterNode(['Red', 'Green', 'Blue'], ['Rojo', 'Verde']);
    rerender(<TranslatorTab {...translatorProps} {...updates} />);

    // category list
    getByText('Blue, Other');
    expect(baseElement).toMatchSnapshot();
  });

  it('hides completed translations', () => {
    const { baseElement, getByText, rerender, queryByText } = render(
      <TranslatorTab {...translatorProps} />
    );

    const updates = createMessageNode('Hello World!', ['yes', 'no'], [], 'Hola Mundo!');

    rerender(<TranslatorTab {...translatorProps} {...updates} />);
    expect(queryByText('Hello World!')).toBeNull();
    expect(baseElement).toMatchSnapshot();
  });
});
