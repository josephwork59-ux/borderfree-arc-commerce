import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import Modal from '../components/Modal';

describe('Modal', () => {
  it('renders the header, body, and footer', () => {
    render(
      <Modal
        header="Check out"
        body={<p>body content</p>}
        footer={<p>footer content</p>}
        handleClose={jest.fn()}
      />,
    );

    expect(screen.getByText('Check out')).toBeInTheDocument();
    expect(screen.getByText('body content')).toBeInTheDocument();
    expect(screen.getByText('footer content')).toBeInTheDocument();
  });

  it('calls handleClose when clicking outside the modal card', async () => {
    const handleClose = jest.fn();
    const user = userEvent.setup();

    render(
      <Modal
        header="Check out"
        body={<p>body content</p>}
        footer={<p>footer content</p>}
        handleClose={handleClose}
      />,
    );

    await user.click(screen.getByText('Check out').closest('.bg-overlay-black'));

    expect(handleClose).toHaveBeenCalled();
  });

  it('does not call handleClose when clicking inside the modal card', async () => {
    const handleClose = jest.fn();
    const user = userEvent.setup();

    render(
      <Modal
        header="Check out"
        body={<p>body content</p>}
        footer={<p>footer content</p>}
        handleClose={handleClose}
      />,
    );

    await user.click(screen.getByText('body content'));

    expect(handleClose).not.toHaveBeenCalled();
  });
});
