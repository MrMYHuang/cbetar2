import React from 'react';
import { IonAlert } from '@ionic/react';
import { RouteComponentProps } from 'react-router-dom';

interface SearchAlertProps {
  showSearchAlert: Boolean | null | undefined;
}

interface PageProps extends RouteComponentProps<{
  tab: string;
  path: string;
  label: string;
}> { }

class SearchAlert extends React.Component<PageProps, SearchAlertProps> {
  constructor(props: any) {
    super(props);
    this.state = {
      showSearchAlert: false,
    };
  }

  render() {
    return (
      <IonAlert
      cssClass='uiFont'
      isOpen={(this.props as any).showSearchAlert}
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
          cssClass: 'secondary uiFont',
          handler: () => (this.props as any).searchCancel(),
        },
        {
          text: '確定',
          cssClass: 'primary uiFont',
          handler: (value) => {
            (this.props as any).searchOk(value.name0);
          },
        }
      ]}
    />
    );
  }
};

export default SearchAlert;
