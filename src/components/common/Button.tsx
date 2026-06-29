import React from 'react';
import { ButtonProps, Button as MantineButton } from '@mantine/core';

interface AppButtonProps extends ButtonProps {
  loading?: boolean;
}

const Button: React.FC<AppButtonProps> = ({ loading, children, ...props }) => {
  return (
    <MantineButton loading={loading} {...props}>
      {children}
    </MantineButton>
  );
};

export default Button;
