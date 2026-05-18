package com.mbsystem.MBSystem.repository.ap;

import com.mbsystem.MBSystem.domain.Ap;
import com.mbsystem.MBSystem.domain.QAp;
import com.querydsl.jpa.impl.JPAQueryFactory;
import jakarta.persistence.EntityManager;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

import static com.mbsystem.MBSystem.domain.QAp.ap;

@Repository
public class ApRepository {

  @Autowired
  private SDJpaApRepository apRepository;

  private final EntityManager em;
  private final JPAQueryFactory queryFactory;

  public ApRepository(EntityManager em) {
    this.em = em;
    this.queryFactory = new JPAQueryFactory(em);
  }

  public Ap save(Ap ap) {
    return apRepository.save(ap);
  }

  public Optional<Ap> findById(Long id) {
    return apRepository.findById(id);
  }

  public Optional<Ap> findBySsidAndPlaceId(String ssid, Long placeId) {
    QAp ap = QAp.ap;

    Ap foundAp = queryFactory
        .selectFrom(ap)
        .where(ap.ssid.eq(ssid),ap.place.id.eq(placeId))
        .fetchOne();

    return Optional.ofNullable(foundAp);
  }

  public List<Ap> findByPlaceId(Long placeId) {

    return queryFactory
        .selectFrom(ap)
        .where(ap.place.id.eq(placeId))
        .fetch();
  }

  public List<Ap> findAll() {
    return apRepository.findAll();
  }

  public void deleteById(Long id) {
    apRepository.deleteById(id);
  }
}