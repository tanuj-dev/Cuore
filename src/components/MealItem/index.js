import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';

const MealItem = ({item, onAdd}) => {
  const getColor = () => {
    switch (item.tag) {
      case 'include':
        return 'green';
      case 'limit':
        return 'orange';
      case 'avoid':
        return 'red';
      default:
        return 'gray';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <View style={[styles.dot, {backgroundColor: getColor()}]} />
        <Text style={styles.name}>1 {item.name}</Text>
      </View>
      <View style={styles.right}>
        <Text style={styles.cal}>{item.cal} cal</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => onAdd(item)}>
          <Text style={styles.addText}>Add</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default MealItem;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 6,
  },
  left: {flexDirection: 'row', alignItems: 'center'},
  dot: {width: 10, height: 10, borderRadius: 5, marginRight: 10},
  name: {fontSize: 16},
  right: {flexDirection: 'row', alignItems: 'center'},
  cal: {marginRight: 10, fontSize: 14, color: '#777'},
  addBtn: {
    borderWidth: 1,
    borderColor: '#333',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  addText: {fontSize: 14},
});
