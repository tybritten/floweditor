import * as React from 'react';
import { render, fireEvent } from 'test/utils';
import { ExitComp, ExitProps } from './Exit';
import { createUUID } from 'utils';
import { Exit, FlowNode } from 'flowTypes';

import { setupStore, mock } from 'testUtils';
import { FlowContents, FlowInfo } from 'temba-components';
import { any } from 'core-js/fn/promise';
import { isRelativeDate } from '../routers/helpers';

const exit: Exit = {
  uuid: createUUID(),
  destination_uuid: createUUID()
};
const categories = [{ uuid: createUUID(), name: 'Red', exit_uuid: exit.uuid }];

const exitProps: ExitProps = {
  exit,
  categories,
  recentContacts: [],
  node: { uuid: createUUID(), actions: [], exits: [] },
  showDragHelper: false,
  dragging: false,
  localization: null,
  segmentCount: 1000,
  plumberConnectExit: (node: FlowNode, exit: Exit) => {},
  plumberRemove: jest.fn(),
  plumberMakeSource: jest.fn(),
  plumberUpdateClass: jest.fn(),
  disconnectExit: jest.fn()
};

jest.useFakeTimers();

describe(ExitComp.name, () => {
  beforeEach(() => {
    setupStore();
  });

  it('renders', () => {
    const { baseElement } = render(<ExitComp {...exitProps} />);
    expect(baseElement).toMatchSnapshot();
  });

  it('shows activity', () => {
    const { baseElement, getByText } = render(
      <>
        <ExitComp
          {...exitProps}
          recentContacts={[
            {
              contact: { uuid: 'eaea6433-d423-41dd-94a9-075de20f322d', name: 'Jim' },
              operand: 'Hi Mom!',
              time: new Date().toUTCString()
            },
            {
              contact: { uuid: 'f781f594-af8b-4493-b67c-2421bf2d4625', name: 'Bob' },
              operand: 'Hi Dad!',
              time: new Date().toUTCString()
            }
          ]}
        />
      </>
    );

    // give our portal a chance to mount
    jest.runAllTimers();

    // we have activity but we can't see our recent contacts yet
    getByText('1,000');
    expect(baseElement).toMatchSnapshot(baseElement);
  });

  it('shows recent contacts on mouse over', () => {
    const { baseElement, getByText, queryAllByText } = render(
      <>
        <div id="activity_recent_contacts"></div>

        <ExitComp
          {...exitProps}
          recentContacts={[
            {
              contact: { uuid: 'eaea6433-d423-41dd-94a9-075de20f322d', name: 'Jim' },
              operand: 'Hi Mom!',
              time: new Date().toUTCString()
            },
            {
              contact: { uuid: 'f781f594-af8b-4493-b67c-2421bf2d4625', name: 'Bob' },
              operand: 'Hi Dad!',
              time: new Date().toUTCString()
            }
          ]}
        />
      </>
    );

    // give our portal a chance to mount
    jest.runAllTimers();

    // now we need to mouse over our activity to see recent contacts
    const activity = getByText('1,000');
    expect(queryAllByText('Recent Contacts').length).toEqual(0);

    fireEvent.mouseEnter(activity);
    jest.runAllTimers();

    expect(queryAllByText('Recent Contacts').length).toEqual(1);
    getByText('Hi Mom!');
    getByText('Hi Dad!');
    expect(baseElement).toMatchSnapshot();
  });

  it('shows missing localization', () => {
    setupStore({ isTranslating: true, languageCode: 'spa' });
    const { baseElement, container } = render(
      <ExitComp {...exitProps} localization={{ spa: {} }} />
    );

    expect(container.querySelector('.missing_localization')).not.toBe(null);
    expect(baseElement).toMatchSnapshot();
  });

  it('shows localization', () => {
    setupStore({ isTranslating: true, languageCode: 'spa' });
    const { baseElement, getByText } = render(
      <ExitComp
        {...exitProps}
        localization={{ spa: { [categories[0].uuid]: { name: ['Hola!'] } } }}
      />
    );

    getByText('Hola!');
    expect(baseElement).toMatchSnapshot();
  });
});
