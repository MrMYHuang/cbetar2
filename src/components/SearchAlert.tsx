import React from 'react';
import { IonAlert } from '@ionic/react';

class SearchAlert extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
    };
  }

  render() {
    return (
      <IonAlert
      isOpen={this.props.showSearchAlert}
      header={'搜尋經文'}
      subHeader='輸入搜尋'
      inputs={[
        {
          name: 'name0',
          type: 'search',
          placeholder: '例:金剛般若'
        },
      ]}
      buttons={[
        {
          text: '取消',
          role: 'cancel',
          cssClass: 'secondary',
          handler: () => this.props.searchCancel(),
        },
        {
          text: '確定',
          cssClass: 'primary',
          handler: () => this.props.searchOk(),
        }
      ]}
    />
    );
  }
};

export default SearchAlert;
