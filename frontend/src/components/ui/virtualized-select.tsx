import React, { useMemo, useState, useEffect } from 'react';
import { FixedSizeList as List } from 'react-window';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from './select';
import { Input } from './input';

interface VirtualizedSelectProps<T> {
  options: T[];
  value: string;
  onChange: (value: string) => void;
  getOptionLabel: (option: T) => string;
  getOptionValue: (option: T) => string;
  placeholder?: string;
  disabled?: boolean;
  searchPlaceholder?: string;
  itemSize?: number; // px
  maxItemsToShow?: number;
  name?: string;
  onBlur?: (e: any) => void;
}

export function VirtualizedSelect<T>({
  options,
  value,
  onChange,
  getOptionLabel,
  getOptionValue,
  placeholder = 'Select...',
  disabled = false,
  searchPlaceholder = 'Search...',
  itemSize = 40,
  maxItemsToShow = 8,
  name,
  onBlur,
}: VirtualizedSelectProps<T>) {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(true);
  const filtered = useMemo(
    () =>
      options.filter((opt) =>
        getOptionLabel(opt).toLowerCase().includes(search.toLowerCase())
      ),
    [search, options, getOptionLabel]
  );
  const listHeight = Math.min(filtered.length, maxItemsToShow) * itemSize;

  useEffect(() => {
    // If options are changing, temporarily mark as not ready
    setReady(false);
    const timeout = setTimeout(() => setReady(true), 100); // 100ms debounce
    return () => clearTimeout(timeout);
  }, [options]);

  useEffect(() => {
    if (open && (!ready || filtered.length === 0)) {
      setOpen(false);
    }
  }, [filtered.length, open, ready]);

  return (
    <Select
      value={value}
      onValueChange={(val) => {
        onChange(val);
        if (onBlur && name) {
          onBlur({ target: { name } });
        }
      }}
      disabled={disabled}
      name={name}
      open={open && ready && filtered.length > 0}
      onOpenChange={setOpen}
    >
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <Input
          placeholder={searchPlaceholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-2"
        />
        {filtered.length > 0 ? (
          <List
            height={listHeight || itemSize}
            itemCount={filtered.length}
            itemSize={itemSize}
            width="100%"
          >
            {({
              index,
              style,
            }: {
              index: number;
              style: React.CSSProperties;
            }) => {
              const opt = filtered[index];
              return (
                <div style={style} key={getOptionValue(opt)}>
                  <SelectItem value={getOptionValue(opt)}>
                    {getOptionLabel(opt)}
                  </SelectItem>
                </div>
              );
            }}
          </List>
        ) : (
          <div className="p-2 text-muted-foreground text-sm">No options</div>
        )}
      </SelectContent>
    </Select>
  );
}
