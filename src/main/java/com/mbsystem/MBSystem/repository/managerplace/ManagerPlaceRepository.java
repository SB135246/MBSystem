package com.mbsystem.MBSystem.repository.managerplace;

import com.mbsystem.MBSystem.domain.ManagerPlace;
import com.mbsystem.MBSystem.domain.QManagerPlace;
import com.mbsystem.MBSystem.repository.sos.SDJpaSosRepository;
import com.querydsl.jpa.impl.JPAQueryFactory;
import jakarta.persistence.EntityManager;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

import static com.mbsystem.MBSystem.domain.QManagerPlace.*;

@Repository
public class ManagerPlaceRepository {
  @Autowired
  private SDJpaManagerPlaceRepository managerPlaceRepository;
  private EntityManager em;
  private JPAQueryFactory queryFactory;

  public ManagerPlaceRepository(EntityManager em) {
    this.em=em;
    this.queryFactory = new JPAQueryFactory(em);
  }

  // ✅ 생성
  public ManagerPlace save(ManagerPlace managerPlace) {
    return managerPlaceRepository.save(managerPlace);
  }

  public List<ManagerPlace> findAll() {
    return managerPlaceRepository.findAll();
  }

  // ✅ manager 기준 조회
  public List<ManagerPlace> findByManagerId(Long managerId) {

    return queryFactory
        .selectFrom(managerPlace)
        .where(managerPlace.manager.id.eq(managerId))
        .fetch();
  }

  public List<ManagerPlace> findByPlaceId(Long placeId) {

    return queryFactory
        .selectFrom(managerPlace)
        .where(managerPlace.place.id.eq(placeId))
        .fetch();
  }

  public Optional<ManagerPlace> findByManagerIdAndPlaceId(Long managerId, Long placeId) {

    ManagerPlace result = queryFactory
        .selectFrom(managerPlace)
        .where(
            managerPlace.manager.id.eq(managerId),
            managerPlace.place.id.eq(placeId)
        )
        .fetchOne();

    return Optional.ofNullable(result);
  }

  public boolean exists(Long managerId, Long placeId) {

    Integer count = queryFactory
        .selectOne()
        .from(managerPlace)
        .where(
            managerPlace.manager.id.eq(managerId),
            managerPlace.place.id.eq(placeId)
        )
        .fetchFirst();

    return count != null;
  }

  public void deleteById(Long id) {
    managerPlaceRepository.deleteById(id);
  }

  public long deleteByManagerId(Long managerId) {

    return queryFactory
        .delete(managerPlace)
        .where(managerPlace.manager.id.eq(managerId))
        .execute();
  }

  public long deleteByPlaceId(Long placeId) {

    return queryFactory
        .delete(managerPlace)
        .where(managerPlace.place.id.eq(placeId))
        .execute();
  }

  public long deleteByManagerIdAndPlaceId(Long managerId, Long placeId) {
    return queryFactory
        .delete(managerPlace)
        .where(
            managerPlace.manager.id.eq(managerId),
            managerPlace.place.id.eq(placeId)
        )
        .execute();
  }


}
