import React from 'react';
import { Options } from 'easymde';
import SimpleMDE from 'react-simplemde-editor';
import 'easymde/dist/easymde.min.css';
import './FileEditor.scss';

// component props
type Props = {
  value?: string;
  onChangeValue: (value?: string) => void;
};

const FileEditor = (props: Props) => {
  const { value, onChangeValue } = props;

  const options = React.useMemo(() => {
    return {
      minHeight: '500px',
    } as Options;
  }, []);

  // 更新 markdown value
  const handleValueChange = React.useCallback(
    (value: string) => {
      onChangeValue(value);
    },
    [onChangeValue]
  );

  return <SimpleMDE value={value} onChange={handleValueChange} options={options} />;
};

export default FileEditor;
