/**
 * AsyncSelect Component
 *
 * A styled AsyncPaginate component that matches the design system's Select component styling.
 * This component provides consistent typography, colors, and interactive states across the application.
 *
 * Features:
 * - Matches native Select component styling (16px font, system fonts, etc.)
 * - Consistent with design system colors and CSS variables
 * - Support for both single and multi-select modes
 * - Async loading with pagination support
 * - Proper focus states and accessibility
 *
 * Usage:
 * ```tsx
 * <AsyncSelect
 *   isMulti
 *   value={selectedOptions}
 *   onChange={(value) => setValue(value)}
 *   loadOptions={async (search, prevOptions, additional) => {
 *     // Your async loading logic
 *     return { options, hasMore, additional };
 *   }}
 *   placeholder="Select options..."
 * />
 * ```
 */

import React from 'react';
import { AsyncPaginate } from 'react-select-async-paginate';
import {
  MultiValue,
  SingleValue,
  OptionsOrGroups,
  GroupBase,
  StylesConfig,
} from 'react-select';
import { cn } from '@/lib/utils';

// Define the option type
export interface SelectOption {
  value: string;
  label: string;
}

// Define the props interface
interface AsyncSelectProps {
  id?: string;
  name?: string;
  value?: SelectOption | SelectOption[] | null;
  onChange: (value: SelectOption | SelectOption[] | null) => void;
  onBlur?: () => void;
  loadOptions: (
    search: string,
    prevOptions: OptionsOrGroups<SelectOption, GroupBase<SelectOption>>,
    additional?: any
  ) => Promise<{
    options: SelectOption[];
    hasMore: boolean;
    additional?: any;
  }>;
  placeholder?: string;
  isMulti?: boolean;
  isDisabled?: boolean;
  className?: string;
  additional?: any;
}

const AsyncSelect: React.FC<AsyncSelectProps> = ({
  id,
  name,
  value,
  onChange,
  onBlur,
  loadOptions,
  placeholder = 'Select...',
  isMulti = false,
  isDisabled = false,
  className,
  additional,
  ...props
}) => {
  // Handle the onChange event to match our expected signature
  const handleChange = (
    newValue: MultiValue<SelectOption> | SingleValue<SelectOption>
  ) => {
    if (isMulti) {
      // For multi-select, convert readonly array to regular array
      onChange(newValue ? [...(newValue as MultiValue<SelectOption>)] : []);
    } else {
      // For single select
      onChange(newValue as SingleValue<SelectOption>);
    }
  };
  const customStyles: StylesConfig<
    SelectOption,
    boolean,
    GroupBase<SelectOption>
  > = {
    control: (provided: any, state: any) => ({
      ...provided,
      minHeight: '40px',
      height: '40px',
      borderColor: state.isFocused ? 'hsl(var(--ring))' : 'hsl(var(--border))',
      borderRadius: 'calc(var(--radius) - 2px)',
      borderWidth: '1px',
      boxShadow: state.isFocused ? '0 0 0 2px hsl(var(--ring))' : 'none',
      backgroundColor: 'hsl(var(--background))',
      fontSize: '0.875rem',
      '&:hover': {
        borderColor: 'hsl(var(--border))',
      },
    }),
    valueContainer: (provided: any) => ({
      ...provided,
      height: '38px',
      padding: '0 12px',
    }),
    input: (provided: any) => ({
      ...provided,
      margin: '0px',
      color: 'hsl(var(--foreground))',
    }),
    indicatorSeparator: () => ({
      display: 'none',
    }),
    indicatorsContainer: (provided: any) => ({
      ...provided,
      height: '38px',
    }),
    placeholder: (provided: any) => ({
      ...provided,
      color: 'black',
      fontSize: '0.875rem',
    }),
    singleValue: (provided: any) => ({
      ...provided,
      color: 'hsl(var(--foreground))',
    }),
    multiValue: (provided: any) => ({
      ...provided,
      backgroundColor: 'hsl(var(--secondary))',
      borderRadius: 'calc(var(--radius) - 2px)',
    }),
    multiValueLabel: (provided: any) => ({
      ...provided,
      color: 'hsl(var(--secondary-foreground))',
      fontSize: '12px',
    }),
    multiValueRemove: (provided: any) => ({
      ...provided,
      color: 'hsl(var(--secondary-foreground))',
      '&:hover': {
        backgroundColor: 'hsl(var(--destructive))',
        color: 'hsl(var(--destructive-foreground))',
      },
    }),
    menu: (provided: any) => ({
      ...provided,
      backgroundColor: 'hsl(var(--popover))',
      border: '1px solid hsl(var(--border))',
      borderRadius: 'calc(var(--radius) - 2px)',
      boxShadow:
        '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    }),
    option: (provided: any, state: any) => ({
      ...provided,
      backgroundColor: state.isFocused
        ? 'hsl(var(--accent))'
        : state.isSelected
        ? 'hsl(var(--accent))'
        : 'transparent',
      color:
        state.isFocused || state.isSelected
          ? 'hsl(var(--accent-foreground))'
          : 'hsl(var(--popover-foreground))',
      fontSize: '0.875rem',
      '&:hover': {
        backgroundColor: 'hsl(var(--accent))',
        color: 'hsl(var(--accent-foreground))',
      },
    }),
  };

  return (
    <AsyncPaginate
      id={id}
      name={name}
      value={value}
      onChange={handleChange}
      onBlur={onBlur}
      loadOptions={loadOptions}
      placeholder={placeholder}
      isMulti={isMulti}
      isDisabled={isDisabled}
      className={cn('react-select-container', className)}
      classNamePrefix="react-select"
      styles={customStyles}
      additional={additional}
      {...props}
    />
  );
};

AsyncSelect.displayName = 'AsyncSelect';

export default AsyncSelect;
