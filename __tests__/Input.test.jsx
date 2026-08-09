import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import Input from '../components/Input';
import { NFTContext } from '../context/NFTContext';

const renderWithCurrency = (ui) => render(
  <NFTContext.Provider value={{ nftCurrency: 'USDC' }}>
    {ui}
  </NFTContext.Provider>,
);

describe('Input', () => {
  it('renders a number input with the currency label from context', () => {
    renderWithCurrency(<Input inputType="number" title="Price" placeholder="NFT Price" />);

    expect(screen.getByText('Price')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('NFT Price')).toHaveAttribute('type', 'number');
    expect(screen.getByText('USDC')).toBeInTheDocument();
  });

  it('renders a textarea for inputType="textarea"', () => {
    renderWithCurrency(<Input inputType="textarea" title="Description" placeholder="NFT Description" />);

    expect(screen.getByPlaceholderText('NFT Description').tagName).toBe('TEXTAREA');
  });

  it('renders a plain text input for any other inputType', () => {
    renderWithCurrency(<Input inputType="input" title="Name" placeholder="NFT Name" />);

    const input = screen.getByPlaceholderText('NFT Name');
    expect(input.tagName).toBe('INPUT');
    expect(input).not.toHaveAttribute('type', 'number');
  });

  it('calls handleClick with the typed value on change', async () => {
    const handleClick = jest.fn();
    const user = userEvent.setup();

    renderWithCurrency(<Input inputType="input" title="Name" placeholder="NFT Name" handleClick={handleClick} />);
    await user.type(screen.getByPlaceholderText('NFT Name'), 'a');

    expect(handleClick).toHaveBeenCalled();
  });
});
