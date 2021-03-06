import React from 'react';

import MessageBarMessage from '../../../app/component/MessageBarMessage';
import { shallowWithIntl } from '../helpers/mock-intl-enzyme';

describe('<MessageBarMessage />', () => {
  it('should render tag "a" for type "a" with content, link and icon', () => {
    const props = {
      content: [{ type: 'a', content: 'This is a link', href: 'foobar' }],
      onMaximize: () => {},
    };
    const wrapper = shallowWithIntl(<MessageBarMessage {...props} />);
    expect(wrapper.find('a').prop('href')).to.equal('foobar');
    expect(wrapper.find('a').text()).to.contain('This is a link');
    expect(wrapper.find('.message-bar-link-icon')).to.have.lengthOf(1);
  });

  it('should not render tag "a" if the href is missing', () => {
    const props = {
      content: [{ type: 'a', content: 'This is a link', href: undefined }],
      onMaximize: () => {},
    };
    const wrapper = shallowWithIntl(<MessageBarMessage {...props} />);
    expect(wrapper.find('a')).to.have.lengthOf(0);
  });

  it('should render tag "h2" for type "heading"', () => {
    const props = {
      content: [{ type: 'heading', content: 'This is a header' }],
      onMaximize: () => {},
    };
    const wrapper = shallowWithIntl(<MessageBarMessage {...props} />);
    expect(wrapper.find('h2').text()).to.equal('This is a header');
  });

  it('should render text for type "type"', () => {
    const props = {
      content: [{ type: 'text', content: 'This is text' }],
      onMaximize: () => {},
    };
    const wrapper = shallowWithIntl(<MessageBarMessage {...props} />);
    expect(wrapper.find('div').text()).to.equal('This is text');
  });
});
