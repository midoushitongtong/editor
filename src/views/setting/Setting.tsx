import './Setting.scss';
import { Container, Tabs, Tab } from 'react-bootstrap';
import SettingFileStorePath from './SettingFileStorePath';
import SettingQinNiu from './SettingQinNiu';

const Setting = () => {
  return (
    <div className="setting">
      <Container fluid className="container">
        {/* title */}
        <div className="title">设置</div>

        <Tabs defaultActiveKey="fileStorePath">
          <Tab eventKey="fileStorePath" title="文件存储位置">
            <SettingFileStorePath />
          </Tab>
          <Tab eventKey="qinNiu" title="七牛云同步">
            <SettingQinNiu />
          </Tab>
        </Tabs>
      </Container>
    </div>
  );
};

export default Setting;
