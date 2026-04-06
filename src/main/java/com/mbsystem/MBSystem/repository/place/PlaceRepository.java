package com.mbsystem.MBSystem.repository.place;

import com.mbsystem.MBSystem.domain.Place;
import com.mbsystem.MBSystem.domain.QPlace;
import com.querydsl.jpa.impl.JPAQueryFactory;
import jakarta.persistence.EntityManager;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

import static com.mbsystem.MBSystem.domain.QPlace.place;

@Repository
public class PlaceRepository {

  @Autowired
  private SDJpaPlaceRepository placeRepository;
  private EntityManager em;
  private JPAQueryFactory queryFactory;

  public PlaceRepository(EntityManager em) {
    this.em=em;
    this.queryFactory=new JPAQueryFactory(em);
  }

  public Place save(Place place) {
    return placeRepository.save(place);
  }

  public Optional<Place> findById(Long id) {
    return placeRepository.findById(id);
  }

  public Optional<Place> findByName(String placeName) {

    Place foundPlace = queryFactory
        .selectFrom(place)
        .where(place.placeName.eq(placeName))
        .fetchOne();

    return Optional.ofNullable(foundPlace);
  }

  public List<Place> findAll() {
    return placeRepository.findAll();
  }

  public List<Place> searchByName(String keyword) {
    QPlace place = QPlace.place;

    return queryFactory
        .selectFrom(place)
        .where(place.placeName.contains(keyword))
        .fetch();
  }

  public boolean existsById(Long id) {
    QPlace place = QPlace.place;

    Integer count = queryFactory
        .selectOne()
        .from(place)
        .where(place.id.eq(id))
        .fetchFirst();

    return count != null;
  }

  public Place update(Place place) {
    return placeRepository.save(place);
  }

  public void deleteById(Long id) {
    placeRepository.deleteById(id);
  }

  public long deleteByName(String placeName) {

    return queryFactory
        .delete(place)
        .where(place.placeName.eq(placeName))
        .execute();
  }

}
