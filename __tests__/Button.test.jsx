import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import Button from '../components/Button';

describe('Button', () => {
  it('renders the button label', () => {
    render(<Button btnName="Connect" />);

    expect(screen.getByRole('button', { name: 'Connect' })).toBeInTheDocument();
  });

  it('calls handleClick when clicked', async () => {
    const handleClick = jest.fn();
    const user = userEvent.setup();

    render(<Button btnName="Connect" handleClick={handleClick} />);
    await user.click(screen.getByRole('button', { name: 'Connect' }));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('applies the classStyles prop to the button className', () => {
    render(<Button btnName="Connect" classStyles="my-custom-class" />);

    expect(screen.getByRole('button', { name: 'Connect' })).toHaveClass('my-custom-class');
  });
});
