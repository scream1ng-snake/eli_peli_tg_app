import { HomeOutlined } from "@ant-design/icons"
import { Toast, Modal, Swiper, Divider, Skeleton, Footer, Avatar, Space, Rate, Dropdown, Radio } from "antd-mobile"
import { observer } from "mobx-react-lite"
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Cart, GurmagLogo, gurmag_big } from '../../../assets';
import { Page } from "../../components";
import { config } from '../../configuration';
import { replaceImgSrc } from '../../helpers';
import { useStore } from '../../hooks';
import { ItemModal } from "../MenuPage/modals/ItemModal";
import './MainPage.css';
import { FC } from 'react';
import Ellipsis from "antd-mobile/es/components/ellipsis";
import Image from "antd-mobile/es/components/image";
import { List } from "antd-mobile";
import moment from "moment";


export const MainPage: FC = observer(() => { 
  const { userStore, actionsPage, mainPage } = useStore();
  const { selectedCourse, state, cookstate, watchCourse } = mainPage;
  const { allCampaign } = userStore.userState; 
  const navigate = useNavigate();

  const [askedAddr, setAskedAddr] = useState(0)
  return(
    <Page>
      {state === 'COMPLETED' && cookstate === 'COMPLETED'
        ? <>
        {selectedCourse 
          ? <ItemModal course={selectedCourse} />
          : null
        }
        {userStore.needAskAdress 
          ? <Modal 
              visible={userStore.needAskAdress} 
              onClose={() => {
                if(askedAddr == 142 || askedAddr == 0) {
                  Toast.show({
                    content: 'Выберите местоположение',
                    position: 'center',
                  })
                }
              }}
              title='Выберите вашу домашнюю кухню:'
              content={
                <Radio.Group 
                  onChange={(e) => setAskedAddr(e as number)}
                >
                  <Space direction='vertical' block>
                    {userStore.organizations.map((org) => 
                      <Radio block value={org.Id} key={org.Id}>
                        {org.Name}
                      </Radio>
                    )}
                  </Space>
                </Radio.Group>
              }
              actions={[
                {
                  key: 'confirm', 
                  text: 'Сохранить', 
                  onClick() {
                    if(askedAddr == 142 || askedAddr == 0) {
                      Toast.show({
                        content: 'Выберите местоположение',
                        position: 'center',
                      })
                    } else {
                      userStore.currentOrg = askedAddr
                    }
                  },
                }
              ]}
            /> 
          : (
            <Dropdown>
              <Dropdown.Item 
                key='sorter' 
                title={
                  <div style={{fontSize: '12px', color: 'var(--тихий-текст)'}}>
                    <HomeOutlined />
                    <span>Ваша домашняя кухня:</span>
                    <br />
                    <span style={{fontSize: '18px', color: 'var(--громкий-текст)'}}>
                      {userStore.currentOrganizaion?.Name}
                    </span>
                  </div>
                }
              >
                <div style={{ padding: 12 }}>
                  <Radio.Group 
                    defaultValue={userStore.currentOrg}
                    onChange={(e) => userStore.currentOrg = e as number}
                  >
                    <Space direction='vertical' block>
                      {userStore.organizations.map((org) => 
                        <Radio block value={org.Id} key={org.Id}>
                          {org.Name}
                        </Radio>
                      )}
                    </Space>
                  </Radio.Group>
                </div>
              </Dropdown.Item>
            </Dropdown>
          )
        }
        
          <Swiper 
            loop
            autoplay
            style={{
              borderRadius: '8px', 
              margin: '0.5rem',
              width: 'calc(100% - 1rem)'
            }}
          >
            {allCampaign.map((campaign, index) => 
              <Swiper.Item key={index}>
                <img 
                  src={config.apiURL + '/api/v2/image/Disount?vcode=' + campaign.VCode} 
                  onError={replaceImgSrc(gurmag_big)} 
                  onClick={() => {
                    actionsPage.watchAction(campaign)
                    navigate('/actions/' + campaign.VCode)
                  }}
                  style={{
                    objectFit: 'cover',
                    width: '100%',
                    height: '180px',
                    display: 'flex'
                  }}
                  alt={campaign.Name} 
                />
              </Swiper.Item>
            )}
          </Swiper>
          
          <Divider contentPosition="left" style={{fontSize: '22px'}} >Сегодня в гурмаге</Divider>
          <Divider contentPosition="left" style={{fontSize: '22px'}} >Сегодня готовят</Divider>
          <div 
            style={{
              margin: '0 0.5rem', 
              width: 'calc(100% - 1rem)', 
              display: 'flex',
              flexWrap: 'nowrap', 
              overflowX: 'scroll', 
              overflowY: 'hidden', 
            }} 
          >
            <Modal 
              visible={mainPage.watchCockModal.show}
              onClose={() => mainPage.closeCookWatch()}
              closeOnMaskClick
              bodyStyle={{width: '80vw'}}
              content={
                mainPage.loadCookInfoState === 'LOADING'
                  ? <>
                    <Skeleton.Paragraph></Skeleton.Paragraph>
                  </>
                  : !mainPage.selectedCock ? null : <>
                    <span>
                      <Rate
                        allowHalf
                        readOnly 
                        count={1}
                        defaultValue={1}
                        style={{'--star-size': '20px' }}
                      />
                      {/* @ts-ignore */}
                      <span style={{fontSize: '20px'}}>
                        {Math.ceil(mainPage.selectedCock?.Rating * 10) / 10}
                      </span>
                    </span>
                    <br />
                    
                    <span>{mainPage.selectedCock.NameWork}</span>


                    {/* @ts-ignore */}
                    {/* {[...new Set(mainPage.selectedCockReviews[0].map((item) => item.Category))].map(str => 
                      <span style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                        <span>{str}</span>
                        <span>
                          <Rate
                            allowHalf
                            readOnly 
                            count={1}
                            defaultValue={1}
                            style={{'--star-size': '14px' }}
                          />  
                        </span>
                    </span>
                    )} */}
                    <List header='Последние отзывы'>
                      {/* @ts-ignore */}
                      {mainPage.selectedCockReviews[0].map((review, index) => (
                        <List.Item
                          key={index}
                          prefix={
                            <Avatar 
                              src=''
                              style={{ 
                                borderRadius: 20, 
                                width: '40px', 
                                height: '40px', 
                              }}
                              fit='cover'
                            />
                          }
                          description={`★${review.Rating} ${review.Course}`}
                        >
                          <span style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                            <span>{review.FIO?.length ? review.FIO : 'Покупатель'}</span>
                            <span style={{fontSize:'12px', color: 'var(--тихий-текст)'}}>
                              {moment(review.Date).format('DD-MM-YYYY')}
                            </span>
                          </span>
                        </List.Item>
                      ))}
                    </List>
                  </>
              }
            />
            {mainPage.cooks.map((cook) => 
                <Space 
                  style={{ '--gap': '3px', width: '33%', margin: '0 0.25rem' }}
                  direction="vertical" 
                  justify="center" 
                  align="center" 
                  key={cook.UserId}
                  onClick={() => mainPage.watchCook(cook)}
                >
                  <Avatar 
                    src={config.apiURL + '/api/v2/image/Cook?vcode=' + cook.UserId} 
                    style={{
                      width: '70px', 
                      height: '70px', 
                      borderRadius: '35px', 
                      objectFit: 'cover'
                    }}
                  />
                  <span style={{color: 'var(--громкий-текст)', fontSize: '18px'}}>{cook.FirstName}</span>
                  <Ellipsis 
                    content={cook.NameWork} 
                    style={{
                      color: 'var(--тихий-текст)', 
                      fontSize: '12px',
                    }}
                  />
                  <Space align="center" style={{'--gap': '3px'}}>
                    <div style={{fontSize: '20px'}} >{Math.ceil(cook.Rating * 10) / 10}</div>
                    <Rate
                      allowHalf
                      readOnly 
                      count={1}
                      defaultValue={cook.Rating}
                      style={{'--star-size': '10px' }}
                    />
                  </Space>
                </Space>
            )}
          </div>
          <Divider contentPosition="left" style={{fontSize: '22px'}} >Популярные блюда</Divider>
          <section className='categories'>
            <div key='популярное' id='популярное'>
              <div className="courses_list">

                {mainPage.categories[0]?.CourseList?.map((course, index) => 
                  <div
                    className="course_item"
                    key={`популярное-${course.Name}-${index}`}
                  >
                    <img
                      src={`${config.apiURL}/api/v2/image/Material?vcode=${course.VCode}&compression=true`}
                      onError={replaceImgSrc(GurmagLogo)}
                      onClick={() => watchCourse(course)}
                    />
                    <div className='item_bady'>
                      <h5 className='title' onClick={() => watchCourse(course)}>{course.Name}</h5>
                      <span style={{ color: 'var(--тихий-текст)' }}>★</span>
                      <span>{Math.ceil(course.Quality * 10) / 10}</span>
                      <div className='price_cart'>
                        <span>{course.Price}</span>
                        <img
                          src={Cart}
                          onClick={() => watchCourse(course)}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
          <Footer content='@ 2023 Gurmag All rights reserved'></Footer>
          <div style={{height: '50px', width: '100%'}}></div> 
        </>
        : preloader()
      }
    </Page>
  )
})


const skeletonStyle: React.CSSProperties = {
  width: 'calc(100% - 1rem)', 
  height: '180px', 
  margin: '0.5rem', 
  borderRadius: '8px', 
}

const preloader = () => [
  <Skeleton animated style={skeletonStyle} />,
  <Skeleton.Title style={{margin: '1rem'}} />,
  <section className='categories'>
    <div>
      <div className="courses_list">
        {new Array(2).fill(null).map((_, index) => 
          <div className="course_item" key={index}>
            <Skeleton style={{width: '100%'}} />
            <div className='item_bady'>
              <Skeleton.Title />
              <Skeleton.Paragraph />
              <Skeleton />
            </div>
          </div>
        )}
      </div>
    </div>
  </section>
]