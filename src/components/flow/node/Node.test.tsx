import { NodeComp, NodeProps } from 'components/flow/node/Node';
import { Types } from 'config/interfaces';
import React from 'react';

import { createRandomNode } from 'testUtils/assetCreators';
import { mock } from 'testUtils';
import * as utils from 'utils';

import { render, TEST_NODE } from 'test/utils';

mock(utils, 'createUUID', utils.seededUUIDs());

const baseProps: NodeProps = {
  nodeUUID: utils.seededUUIDs(),
  startingNode: true,
  onlyNode: true,
  selected: false,
  plumberMakeTarget: jest.fn(),
  plumberRecalculate: jest.fn(),
  plumberMakeSource: jest.fn(),
  plumberRemove: jest.fn(),
  plumberConnectExit: jest.fn(),
  plumberUpdateClass: jest.fn(),
  scrollToNode: '',
  scrollToAction: '',
  activeCount: 0,
  simulating: false,
  debug: null,
  renderNode: {
    node: TEST_NODE,
    ui: {
      position: { left: 0, top: 0 },
      type: Types.execute_actions
    },
    inboundConnections: {}
  },
  onAddToNode: jest.fn(),
  onOpenNodeEditor: jest.fn(),
  removeNode: jest.fn(),
  mergeEditorState: jest.fn(),
  issues: []
};

describe(NodeComp.name, () => {
  beforeEach(() => {
    mock(utils, 'createUUID', utils.seededUUIDs());
  });

  it('renders', () => {
    const { baseElement } = render(<NodeComp {...baseProps} />);
    expect(baseElement).toMatchSnapshot();
  });

  it('renders a named random split', () => {
    const randomSplit = createRandomNode(3);
    randomSplit.node.router.result_name = 'My Random Split';
    const { baseElement } = render(<NodeComp {...baseProps} renderNode={randomSplit} />);
    expect(baseElement).toMatchSnapshot();
  });
});
