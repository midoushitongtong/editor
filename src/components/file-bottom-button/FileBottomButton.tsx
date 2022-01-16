import React from 'react';
import { Button, ButtonProps } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import './FileBottomButton.scss';
import { IconProp } from '@fortawesome/fontawesome-svg-core';

// component props
type Props = {
  icon: IconProp;
  text: string;
  variant: string;
} & Partial<ButtonProps>;

const FileBottomButton = (props: Props) => {
  const { icon, text, ...otherProps } = props;

  return (
    <Button type="button" {...otherProps}>
      <FontAwesomeIcon icon={icon} className="me-2" />
      {text}
    </Button>
  );
};

export default FileBottomButton;
