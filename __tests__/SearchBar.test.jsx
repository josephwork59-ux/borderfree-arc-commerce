import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import SearchBar from '../components/SearchBar';

describe('SearchBar', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('debounces typing before calling handleSearch', async () => {
    const handleSearch = jest.fn();
    const clearSearch = jest.fn();
    const user = userEvent.setup({ delay: null, advanceTimers: jest.advanceTimersByTime });

    render(
      <SearchBar
        activeSelect="Recently added"
        setActiveSelect={jest.fn()}
        handleSearch={handleSearch}
        clearSearch={clearSearch}
      />,
    );

    await user.type(screen.getByPlaceholderText('Search NFT here...'), 'cool nft');

    // handleSearch should not fire before the debounce timer elapses
    expect(handleSearch).not.toHaveBeenCalled();

    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    expect(handleSearch).toHaveBeenCalledWith('cool nft');
  });

  it('calls clearSearch once the debounced value becomes empty', async () => {
    const handleSearch = jest.fn();
    const clearSearch = jest.fn();

    render(
      <SearchBar
        activeSelect="Recently added"
        setActiveSelect={jest.fn()}
        handleSearch={handleSearch}
        clearSearch={clearSearch}
      />,
    );

    // clearSearch fires on mount because the debounced search starts empty
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    expect(clearSearch).toHaveBeenCalled();
  });

  it('toggles the sort dropdown and calls setActiveSelect on selection', async () => {
    const setActiveSelect = jest.fn();
    const user = userEvent.setup({ delay: null, advanceTimers: jest.advanceTimersByTime });

    render(
      <SearchBar
        activeSelect="Recently added"
        setActiveSelect={setActiveSelect}
        handleSearch={jest.fn()}
        clearSearch={jest.fn()}
      />,
    );

    expect(screen.queryByText('Price (low to high)')).not.toBeInTheDocument();

    await user.click(screen.getByText('Recently added'));

    expect(screen.getByText('Price (low to high)')).toBeInTheDocument();

    await user.click(screen.getByText('Price (low to high)'));

    expect(setActiveSelect).toHaveBeenCalledWith('Price (low to high)');
  });
});
