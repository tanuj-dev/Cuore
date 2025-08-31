import { View, Text,Platform ,TouchableOpacity,Image, StyleSheet} from 'react-native'
import React from 'react'
import {hp,wp,Images} from '../../utilities'

const Header = ({title,navigation}) => {
  return (
   <View style={{   backgroundColor: '#FFFFFF',}}>  <View
        style={{
          flexDirection: 'row',
              marginTop:Platform.OS =='ios'&& hp(5),
       
          elevation: 1,
        }}>
        <TouchableOpacity
          style={{paddingHorizontal: hp(1)}}
          onPress={() => navigation.goBack()}>
          <Image
            source={Images.BACK_BUTTON} // Replace with actual key in your `images` object
            style={{
              resizeMode: 'contain',
              height: hp(3.5),
              width: wp(4),
            }}
            resizeMode="contain"
          />
        </TouchableOpacity>
        <Text style={styles.title}>{title}</Text>
      </View></View>
  )
}


const styles =StyleSheet.create({
     title: {
    fontFamily: 'Roboto-Regular',
    marginTop: hp(1),
    marginLeft: hp(12),
    fontSize: 20,
    fontWeight: '400',
    marginBottom: hp(2),
    alignSelf: 'center',
    color: '#000000',
  },
})

export default Header