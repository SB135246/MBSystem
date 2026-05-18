package com.mbsystem.MBSystem.repository.sos;

import com.mbsystem.MBSystem.domain.Sos;
import com.querydsl.jpa.impl.JPAQueryFactory;
import jakarta.persistence.EntityManager;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;
import java.util.Optional;

import java.util.List;

import com.mbsystem.MBSystem.domain.QModule;

import static com.mbsystem.MBSystem.domain.QSos.*;

@Repository
public class SosRepository {

  @Autowired
  private SDJpaSosRepository sosRepository;
  private EntityManager em;
  private JPAQueryFactory queryFactory;

  public SosRepository(EntityManager em) {
    this.em=em;
    this.queryFactory = new JPAQueryFactory(em);
  }

  public Sos save(Sos sos) {
    return sosRepository.save(sos);
  }

    // sosId로 단건 조회
    public Optional<Sos> findBySosId(Long sosId) {
        return sosRepository.findById(sosId);
    }

    //전체 조회
  public List<Sos> findById(Long moduleId){
    return queryFactory.selectFrom(sos)
        .where(sos.module.id.eq(moduleId))
        .fetch();
  }

  public List<Sos> findByPlaceId(Long placeId) {
    return queryFactory.selectFrom(sos)
        .join(sos.module, QModule.module)
        .where(QModule.module.place.id.eq(placeId))
        .orderBy(sos.sosAt.desc())
        .fetch();
  }

  public void delete(Long moduleId){
    queryFactory.delete(sos)
        .where(sos.module.id.eq(moduleId))
        .execute();
  }
}
