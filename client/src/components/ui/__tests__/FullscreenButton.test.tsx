import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { FullscreenButton } from '../';

describe('FullscreenButton', () => {
  // Setup mocks before each test
  beforeEach(() => {
    // Mock document.fullscreenEnabled
    Object.defineProperty(document, 'fullscreenEnabled', {
      writable: true,
      value: true
    });
    
    // Mock document.fullscreenElement
    Object.defineProperty(document, 'fullscreenElement', {
      writable: true,
      value: null
    });
    
    // Mock requestFullscreen
    const mockRequestFullscreen = jest.fn().mockResolvedValue(undefined);
    
    // Mock getElementById
    document.getElementById = jest.fn().mockImplementation(() => ({
      requestFullscreen: mockRequestFullscreen,
      mozRequestFullScreen: undefined,
      webkitRequestFullscreen: undefined,
      msRequestFullscreen: undefined
    }));
    
    // Mock document.exitFullscreen
    document.exitFullscreen = jest.fn().mockResolvedValue(undefined);
  });

describe('FullscreenButton', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    // Reset fullscreenElement
    Object.defineProperty(document, 'fullscreenElement', {
      writable: true,
      value: null
    });
  });

  test('renders the button', () => {
    const { container } = render(<FullscreenButton targetId="test-id" />);
    const button = container.querySelector('button');
    expect(button).toBeInTheDocument();
  });

  test('calls requestFullscreen when clicked and not in fullscreen mode', () => {
    const { container } = render(<FullscreenButton targetId="test-id" />);
    const button = container.querySelector('button');
    
    if (button) {
      fireEvent.click(button);
    }
    
    expect(document.getElementById).toHaveBeenCalledWith('test-id');
    expect(mockRequestFullscreen).toHaveBeenCalled();
    expect(mockExitFullscreen).not.toHaveBeenCalled();
  });

  test('calls exitFullscreen when clicked and in fullscreen mode', () => {
    // Mock being in fullscreen mode
    Object.defineProperty(document, 'fullscreenElement', {
      writable: true,
      value: document.createElement('div')
    });
    
    const { container } = render(<FullscreenButton targetId="test-id" />);
    const button = container.querySelector('button');
    
    if (button) {
      fireEvent.click(button);
    }
    
    expect(mockExitFullscreen).toHaveBeenCalled();
    expect(mockRequestFullscreen).not.toHaveBeenCalled();
  });

  test('does not render if fullscreen API is not available', () => {
    // Mock fullscreenEnabled to be false
    Object.defineProperty(document, 'fullscreenEnabled', {
      writable: true,
      value: false
    });
    
    const { container } = render(<FullscreenButton targetId="test-id" />);
    
    // The component should not render anything
    expect(container.firstChild).toBeNull();
  });
});